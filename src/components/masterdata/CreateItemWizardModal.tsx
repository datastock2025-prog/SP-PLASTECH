import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Save,
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Box,
  Wrench,
  Droplet,
  RefreshCw,
  FlaskConical,
  Package,
  Fuel,
  Palette,
  Sparkles,
  GitPullRequest,
  Lock,
  Building,
  Image as ImageIcon,
  Database,
  Search,
  ExternalLink,
  Zap,
  Truck,
  MapPin,
  Store,
} from 'lucide-react';
import { ItemMaster, ItemType, ApprovalStatus, ItemStatus } from '../../types';
import { MasterDataRecord } from '../../data/mockAdminExtendedData';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';
import { itemService } from '../../services/itemService';
import { adminEventBus } from '../../services/adminService';
import { MasterDataCombobox } from '../common/MasterDataCombobox';

interface ConversionRow {
  id: string;
  from: string;
  to: string;
  factor: number;
}

interface CreateItemWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: ItemMaster) => void;
  editItem?: ItemMaster | null;
  allItems?: ItemMaster[];
  showToast: (msg: string) => void;
}

export const CreateItemWizardModal: React.FC<CreateItemWizardProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  editItem = null,
  allItems,
  showToast,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('12:04');

  // Step 1: Item Type
  const [selectedType, setSelectedType] = useState<ItemType>(editItem?.type || 'Finished Good');

  // Step 2: Basic Information & Validation (Task 2)
  const [itemCode, setItemCode] = useState<string>(editItem?.code || '');
  const [itemCodeError, setItemCodeError] = useState<boolean>(false);
  const [itemName, setItemName] = useState<string>(editItem?.name || '');
  const [category, setCategory] = useState<string>(editItem?.cat || '');
  const [itemGroup, setItemGroup] = useState<string>(editItem?.itemGroup || '');
  const [status, setStatus] = useState<string>(editItem?.approval === 'approved' ? 'Active' : 'Active');
  const [description, setDescription] = useState<string>(editItem?.desc || '');
  
  // Live Image State (Task 2)
  const [itemImage, setItemImage] = useState<string | null>(null);
  const [itemImageName, setItemImageName] = useState<string>('');
  const [itemImageSize, setItemImageSize] = useState<string>('');
  const [isImageDragging, setIsImageDragging] = useState<boolean>(false);

  // Master Data Catalogs & Governance Integration (Task 1)
  const [categoryList, setCategoryList] = useState<string[]>(() => masterDataGovernanceService.getCategories());
  const [itemGroupList, setItemGroupList] = useState<string[]>(() => masterDataGovernanceService.getItemGroups());
  const [uomList, setUomList] = useState<string[]>(() => masterDataGovernanceService.getUoms());
  const [plantScopeList, setPlantScopeList] = useState<string[]>(() => masterDataGovernanceService.getPlantScopes());
  const [resinTypeList, setResinTypeList] = useState<string[]>(() => masterDataGovernanceService.getResinTypes());
  const [colorList, setColorList] = useState<string[]>(() => masterDataGovernanceService.getColors());
  const [complianceList, setComplianceList] = useState<string[]>(() => masterDataGovernanceService.getComplianceMandates());
  const [testingLabList, setTestingLabList] = useState<string[]>(() => masterDataGovernanceService.getTestingLabs());
  const [packingStandardList, setPackingStandardList] = useState<string[]>(() => masterDataGovernanceService.getPackingStandards());

  const [masterRecords, setMasterRecords] = useState<MasterDataRecord[]>(() =>
    masterDataGovernanceService.getAllRecords()
  );
  const [showCodeDropdown, setShowCodeDropdown] = useState<boolean>(false);
  const [syncedMasterRecord, setSyncedMasterRecord] = useState<MasterDataRecord | null>(() => {
    if (editItem?.code) {
      return masterDataGovernanceService.getRecordByCode(editItem.code) || null;
    }
    return null;
  });
  const [isMasterDataModalOpen, setIsMasterDataModalOpen] = useState<boolean>(false);
  const [masterModalForm, setMasterModalForm] = useState<Partial<MasterDataRecord>>({
    entityType: 'Polymer Resin Item',
    code: '',
    name: '',
    primaryUom: 'Kilograms (KG)',
    category: 'Virgin Raw Polymer',
    itemGroup: 'Polymer Feedstock',
    plantScope: 'All Plants (Global)',
    complianceCert: 'RoHS, REACH, UL-94 HB',
    status: 'Approved',
  });
  const codeDropdownRef = useRef<HTMLDivElement>(null);

  // Task 1: Supplier Governance & Autocomplete State
  const [supplierList, setSupplierList] = useState(() => masterDataGovernanceService.getSuppliers());
  const [showSupplierDropdown, setShowSupplierDropdown] = useState<boolean>(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState<boolean>(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    code: '',
    name: '',
    category: 'Virgin Resin',
    hsnCode: '39021000',
    tariffCode: '3902.10.00',
    moq: 1000,
    leadTimeDays: 7,
    paymentTerms: 'Net 30 Days',
  });

  // Task 3: Warehouse & Bin Governance State
  const [warehouseList, setWarehouseList] = useState(() => masterDataGovernanceService.getWarehouses());
  const [binList, setBinList] = useState(() => masterDataGovernanceService.getBins());
  const [showBinDropdown, setShowBinDropdown] = useState<boolean>(false);
  const binDropdownRef = useRef<HTMLDivElement>(null);
  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState<boolean>(false);
  const [newWarehouseForm, setNewWarehouseForm] = useState({
    code: '',
    name: '',
    zone: 'Zone A - Polymer Silos',
    plantScope: 'All Plants',
  });
  const [isNewBinModalOpen, setIsNewBinModalOpen] = useState<boolean>(false);
  const [newBinForm, setNewBinForm] = useState({
    code: '',
    warehouseCode: 'RM-WH-01',
    zone: 'Standard Storage Zone',
  });

  const [filterAllTypes, setFilterAllTypes] = useState<boolean>(false);

  // Subscribe to Master Data governance updates
  useEffect(() => {
    const unsub = adminEventBus.subscribe(() => {
      setMasterRecords(masterDataGovernanceService.getAllRecords());
      setSupplierList(masterDataGovernanceService.getSuppliers());
      setWarehouseList(masterDataGovernanceService.getWarehouses());
      setBinList(masterDataGovernanceService.getBins());
      setCategoryList(masterDataGovernanceService.getCategories());
      setItemGroupList(masterDataGovernanceService.getItemGroups());
      setUomList(masterDataGovernanceService.getUoms());
      setPlantScopeList(masterDataGovernanceService.getPlantScopes());
      setResinTypeList(masterDataGovernanceService.getResinTypes());
      setColorList(masterDataGovernanceService.getColors());
      setComplianceList(masterDataGovernanceService.getComplianceMandates());
      setTestingLabList(masterDataGovernanceService.getTestingLabs());
      setPackingStandardList(masterDataGovernanceService.getPackingStandards());
    });
    return unsub;
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (codeDropdownRef.current && !codeDropdownRef.current.contains(e.target as Node)) {
        setShowCodeDropdown(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target as Node)) {
        setShowSupplierDropdown(false);
      }
      if (binDropdownRef.current && !binDropdownRef.current.contains(e.target as Node)) {
        setShowBinDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Map Item Type (Step 1) to Admin Master Data Entity Types (Task 1)
  const itemTypeToEntityMap: Record<ItemType, string[]> = {
    'Finished Good': ['Finished Molded Component'],
    'Semi-Finished Good': ['Finished Molded Component'],
    'Raw Material': ['Polymer Resin Item'],
    'Regrind': ['Polymer Resin Item'],
    'Masterbatch': ['Color Masterbatch'],
    'Colorant': ['Color Masterbatch'],
    'Additive': ['Color Masterbatch'],
    'Spare Part': ['Tooling & Mold Asset'],
    'Packaging Material': ['Finished Molded Component', 'Polymer Resin Item'],
    'Consumable': ['Color Masterbatch', 'Polymer Resin Item'],
  };

  // Active Item Master Grid Items & Duplicate Validation
  const currentGridItems: ItemMaster[] = (allItems && allItems.length > 0) ? allItems : itemService.getItemsSync();
  const isEditing = !!editItem;
  const currentEditCode = (editItem?.code || '').trim().toLowerCase();
  const currentEditName = (editItem?.name || '').trim().toLowerCase();

  // Codes and Names of items currently waiting for approval or rejected in Item Master Grid
  const pendingOrRejectedCodes = new Set(
    currentGridItems
      .filter((i) => i.approval === 'pending' || i.approval === 'rejected' || i.status === 'rejected' || i.status === 'quarantined')
      .map((i) => (i.code || '').trim().toLowerCase())
  );

  const pendingOrRejectedNames = new Set(
    currentGridItems
      .filter((i) => i.approval === 'pending' || i.approval === 'rejected' || i.status === 'rejected' || i.status === 'quarantined')
      .map((i) => (i.name || '').trim().toLowerCase())
  );

  // Exact duplicate checkers
  const checkDuplicateCode = (codeToCheck: string): { isDuplicate: boolean; item?: ItemMaster } => {
    const clean = (codeToCheck || '').trim().toLowerCase();
    if (!clean) return { isDuplicate: false };
    if (isEditing && clean === currentEditCode) return { isDuplicate: false };
    const matched = currentGridItems.find(
      (i) => (i.code || '').trim().toLowerCase() === clean && (!isEditing || (i.code || '').trim().toLowerCase() !== currentEditCode)
    );
    return { isDuplicate: !!matched, item: matched };
  };

  const checkDuplicateName = (nameToCheck: string): { isDuplicate: boolean; item?: ItemMaster } => {
    const clean = (nameToCheck || '').trim().toLowerCase();
    if (!clean) return { isDuplicate: false };
    if (isEditing && clean === currentEditName) return { isDuplicate: false };
    const matched = currentGridItems.find(
      (i) => (i.name || '').trim().toLowerCase() === clean && (!isEditing || (i.name || '').trim().toLowerCase() !== currentEditName)
    );
    return { isDuplicate: !!matched, item: matched };
  };

  // Real-time duplicate status for active inputs
  const duplicateCodeMatch = checkDuplicateCode(itemCode);
  const duplicateNameMatch = checkDuplicateName(itemName);

  // Filter master data records based on selected item type and search query
  // STRICT REQUIREMENT: Do NOT show items already waiting for approval or rejected in Item Master grid
  const allowedEntities = itemTypeToEntityMap[selectedType] || ['Finished Molded Component'];
  const filteredMasterCodes = masterRecords.filter((r) => {
    const rCodeLower = (r.code || '').trim().toLowerCase();
    const rNameLower = (r.name || '').trim().toLowerCase();

    // 1. Exclude items already waiting for approval or rejected in Item Master grid
    if (pendingOrRejectedCodes.has(rCodeLower) || pendingOrRejectedNames.has(rNameLower)) {
      return false;
    }
    // 2. Exclude records marked as Rejected or Pending in governance
    if (r.status === 'Rejected' || r.status === 'Pending' || (r as any).approval === 'rejected' || (r as any).approval === 'pending') {
      return false;
    }
    // 3. When creating new item, exclude any codes/names already active in Item Master grid to prevent duplicate SKU selection
    if (!isEditing) {
      const alreadyInGrid = currentGridItems.some(
        (i) => (i.code || '').trim().toLowerCase() === rCodeLower || (i.name || '').trim().toLowerCase() === rNameLower
      );
      if (alreadyInGrid) return false;
    }

    const matchType = filterAllTypes || allowedEntities.includes(r.entityType);
    if (!matchType) return false;
    if (!itemCode || !itemCode.trim()) return true;
    const q = itemCode.trim().toLowerCase();
    return (
      (r.code || '').toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.itemGroup && r.itemGroup.toLowerCase().includes(q)) ||
      (r.resinType && r.resinType.toLowerCase().includes(q)) ||
      (r.color && r.color.toLowerCase().includes(q))
    );
  });

  // Apply Master Data Record to Wizard Form
  const handleApplyMasterRecord = (rec: MasterDataRecord) => {
    const dupCheckCode = checkDuplicateCode(rec.code);
    if (dupCheckCode.isDuplicate) {
      showToast(`Cannot select "${rec.code}": Code already in use by ${dupCheckCode.item?.code} (${dupCheckCode.item?.approval || 'active'}).`);
      return;
    }
    const dupCheckName = checkDuplicateName(rec.name);
    if (dupCheckName.isDuplicate) {
      showToast(`Cannot select "${rec.name}": Name already in use by ${dupCheckName.item?.code} (${dupCheckName.item?.approval || 'active'}).`);
      return;
    }

    setItemCode(rec.code);
    setItemName(rec.name);
    setCategory(rec.category);
    setItemGroup(
      rec.itemGroup ||
      (rec.entityType === 'Polymer Resin Item'
        ? 'Polymer Feedstock'
        : rec.entityType === 'Color Masterbatch'
        ? 'Colorants & Additives'
        : rec.entityType === 'Finished Molded Component'
        ? 'Automotive Assemblies'
        : rec.entityType === 'Tooling & Mold Asset'
        ? 'Tooling & Mold Spares'
        : 'General Catalog')
    );

    // Task 2: Auto-fill Manufacturing Attributes (Resin Type, Color, Grade, MFI, Density)
    const derivedResin = rec.resinType || (rec.entityType === 'Polymer Resin Item' ? 'Polypropylene (PP)' : rec.entityType === 'Finished Molded Component' ? 'Impact Copolymer PP + 15% EPDM' : '');
    const derivedColor = rec.color || (rec.entityType === 'Color Masterbatch' ? 'Carbon Black (RAL 9005)' : rec.entityType === 'Finished Molded Component' ? 'Midnight Black / Painted Gloss' : 'Natural / Milky White');
    
    if (derivedResin) setResinType(derivedResin);
    if (derivedColor) setColor(derivedColor);
    if (rec.polymerGrade) setPolymerGrade(rec.polymerGrade);
    if (rec.mfi) setMfi(rec.mfi);
    if (rec.density) setDensity(rec.density);

    // Auto-map type & UOM
    if (rec.entityType === 'Polymer Resin Item') {
      setSelectedType('Raw Material');
      setBaseUOM('KG');
      setPurchaseUOM('KG');
      setStockUOM('KG');
    } else if (rec.entityType === 'Color Masterbatch') {
      setSelectedType('Masterbatch');
      setBaseUOM('KG');
      setPurchaseUOM('KG');
      setStockUOM('KG');
    } else if (rec.entityType === 'Finished Molded Component') {
      setSelectedType('Finished Good');
      setBaseUOM('PCS');
      setPurchaseUOM('PCS');
      setSalesUOM('PCS');
      setStockUOM('PCS');
    } else if (rec.entityType === 'Tooling & Mold Asset') {
      setSelectedType('Spare Part');
      setBaseUOM('PCS');
    }

    if (rec.complianceCert && !description) {
      setDescription(`Compliance: ${rec.complianceCert}`);
    }

    setSyncedMasterRecord(rec);
    setItemCodeError(false);
    setShowCodeDropdown(false);
    showToast(`✓ Master data "${rec.code}" auto-filled: Name, Category, Group, Resin (${derivedResin || 'PP'}), Color (${derivedColor || 'Natural'})`);
  };

  const handleItemCodeChange = (val: string) => {
    setItemCode(val);
    if (val.trim()) setItemCodeError(false);
    setShowCodeDropdown(true);

    // If exact match exists in master records, auto-fill immediately if not duplicate
    const matched = masterDataGovernanceService.getRecordByCode(val);
    if (matched) {
      const codeLower = (matched.code || '').toLowerCase();
      const nameLower = (matched.name || '').toLowerCase();
      if (!pendingOrRejectedCodes.has(codeLower) && !pendingOrRejectedNames.has(nameLower)) {
        handleApplyMasterRecord(matched);
      }
    } else if (syncedMasterRecord && syncedMasterRecord.code.toLowerCase() !== val.toLowerCase()) {
      setSyncedMasterRecord(null);
    }
  };

  const handleOpenNewMasterModal = (prefilledCode?: string) => {
    const codeToUse =
      (prefilledCode && prefilledCode.trim()) ||
      (itemCode && itemCode.trim()) ||
      (selectedType === 'Raw Material' ? 'RES-PP-COPO-02' : selectedType === 'Masterbatch' ? 'MB-BLK-AUTO-03' : 'FG-BMP-NEXON-R');

    const entity: MasterDataRecord['entityType'] =
      selectedType === 'Raw Material' || selectedType === 'Regrind'
        ? 'Polymer Resin Item'
        : selectedType === 'Masterbatch' || selectedType === 'Colorant' || selectedType === 'Additive'
        ? 'Color Masterbatch'
        : selectedType === 'Finished Good' || selectedType === 'Semi-Finished Good'
        ? 'Finished Molded Component'
        : selectedType === 'Spare Part'
        ? 'Tooling & Mold Asset'
        : 'Polymer Resin Item';

    const defaultResin = resinType || (entity === 'Polymer Resin Item' ? 'Polypropylene (PP)' : entity === 'Finished Molded Component' ? 'Impact Copolymer PP + 15% EPDM' : '');
    const defaultColor = color || (entity === 'Color Masterbatch' ? 'Carbon Black (RAL 9005)' : entity === 'Finished Molded Component' ? 'Midnight Black / Painted Gloss' : 'Natural / Milky White');

    setMasterModalForm({
      entityType: entity,
      code: codeToUse.toUpperCase(),
      name: itemName || '',
      primaryUom: entity.includes('Resin') || entity.includes('Masterbatch') ? 'Kilograms (KG)' : 'Numbers (PCS)',
      category: category || (entity === 'Polymer Resin Item' ? 'Virgin Raw Polymer' : entity === 'Color Masterbatch' ? 'Additives & Pigments' : 'Automotive Exterior'),
      itemGroup: itemGroup || (entity === 'Polymer Resin Item' ? 'Polymer Feedstock' : entity === 'Color Masterbatch' ? 'Colorants & Additives' : 'Automotive Assemblies'),
      plantScope: 'All Plants (Global)',
      complianceCert: 'RoHS, REACH, UL-94 HB, PPAP Level-3',
      status: 'Approved',
      description: description || '',
      resinType: defaultResin,
      color: defaultColor,
      polymerGrade: polymerGrade || '',
      mfi: mfi || '',
      density: density || '',
    });
    setShowCodeDropdown(false);
    setIsMasterDataModalOpen(true);
  };

  const handleSaveMasterModalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterModalForm.code || !masterModalForm.name) {
      showToast('Please provide both Master Code and Description Name.');
      return;
    }

    const codeToSave = masterModalForm.code.trim().toUpperCase();
    const nameToSave = masterModalForm.name.trim();

    // Check if code or name duplicates existing item master SKUs
    const dupCheckCode = checkDuplicateCode(codeToSave);
    if (dupCheckCode.isDuplicate) {
      showToast(`Cannot register Master Code "${codeToSave}": Code already exists in Item Master (${dupCheckCode.item?.approval || 'active'}).`);
      return;
    }
    const dupCheckName = checkDuplicateName(nameToSave);
    if (dupCheckName.isDuplicate) {
      showToast(`Cannot register Master Name "${nameToSave}": Name already used by SKU ${dupCheckName.item?.code}.`);
      return;
    }

    const saved = masterDataGovernanceService.saveRecord({
      ...(masterModalForm as any),
      code: codeToSave,
      name: nameToSave,
    });

    // Auto-fill wizard
    handleApplyMasterRecord(saved);
    setIsMasterDataModalOpen(false);
    showToast(`Master record ${saved.code} registered in Admin Governance & auto-filled!`);
  };

  // Task 1: Supplier Governance Handlers
  const handleSelectSupplier = (sup: { name: string; hsnCode?: string; moq?: number; leadTimeDays?: number }) => {
    setPreferredSupplier(sup.name);
    if (sup.hsnCode) setHsnCode(sup.hsnCode);
    if (sup.moq) setPurchaseMoq(sup.moq);
    if (sup.leadTimeDays) setLeadTimeDays(sup.leadTimeDays);
    setShowSupplierDropdown(false);
    showToast(`✓ Supplier "${sup.name}" selected: HSN (${sup.hsnCode || '39021000'}) & MOQ (${sup.moq || 1000}) auto-filled!`);
  };

  const handleOpenNewSupplierModal = (prefilledName?: string) => {
    setNewSupplierForm({
      code: `SUP-${Date.now().toString().slice(-4)}`,
      name: prefilledName || preferredSupplier || '',
      category: selectedType === 'Masterbatch' || selectedType === 'Colorant' ? 'Masterbatch & Colorants' : selectedType === 'Spare Part' ? 'Molds & Tooling' : 'Virgin Resin',
      hsnCode: selectedType === 'Masterbatch' ? '32061110' : selectedType === 'Spare Part' ? '84807100' : '39021000',
      tariffCode: selectedType === 'Masterbatch' ? '3206.11.10' : selectedType === 'Spare Part' ? '8480.71.00' : '3902.10.00',
      moq: selectedType === 'Masterbatch' ? 500 : selectedType === 'Spare Part' ? 1 : 2000,
      leadTimeDays: 7,
      paymentTerms: 'Net 30 Days',
    });
    setShowSupplierDropdown(false);
    setIsNewSupplierModalOpen(true);
  };

  const handleSaveNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierForm.name.trim()) {
      showToast('Please enter supplier company name.');
      return;
    }
    const saved = masterDataGovernanceService.saveSupplier(newSupplierForm);
    setPreferredSupplier(saved.name);
    setHsnCode(saved.hsnCode);
    setPurchaseMoq(saved.moq);
    setLeadTimeDays(saved.leadTimeDays);
    setIsNewSupplierModalOpen(false);
    showToast(`✓ Supplier "${saved.name}" registered in Master Data & auto-filled HSN (${saved.hsnCode}) and MOQ (${saved.moq})!`);
  };

  // Task 3: Warehouse & Bin Governance Handlers
  const handleOpenNewWarehouseModal = () => {
    const prefix = selectedType === 'Raw Material' ? 'RM-WH' : selectedType === 'Masterbatch' ? 'MB-STORE' : 'FG-WH';
    setNewWarehouseForm({
      code: `${prefix}-${Date.now().toString().slice(-2)}`,
      name: '',
      zone: selectedType === 'Raw Material' ? 'Zone A - Heavy Polymer Silos' : selectedType === 'Masterbatch' ? 'Zone B - Additives Vault' : 'Zone C - Automated Pallet Racks',
      plantScope: 'All Plants (Global)',
    });
    setIsNewWarehouseModalOpen(true);
  };

  const handleSaveNewWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseForm.code.trim() || !newWarehouseForm.name.trim()) {
      showToast('Please provide both Warehouse Code and Warehouse Name.');
      return;
    }
    const saved = masterDataGovernanceService.saveWarehouse(newWarehouseForm);
    setDefaultWarehouse(saved.code);
    setIsNewWarehouseModalOpen(false);
    showToast(`✓ Warehouse "${saved.code} - ${saved.name}" registered in Master Data & selected!`);
  };

  const handleSaveNewBin = (codeToSave?: string) => {
    const code = (codeToSave || defaultBin || '').trim().toUpperCase();
    if (!code) {
      showToast('Please enter a bin location code.');
      return;
    }
    const saved = masterDataGovernanceService.saveBin({
      code,
      warehouseCode: defaultWarehouse,
      zone: 'Storage Rack/Aisle',
    });
    setDefaultBin(saved.code);
    setShowBinDropdown(false);
    setIsNewBinModalOpen(false);
    showToast(`✓ Storage Bin "${saved.code}" registered in Master Data under warehouse ${defaultWarehouse}!`);
  };

  // Finished Good Technical & Injection Molding Parameters
  const [cycleTime, setCycleTime] = useState<number | string>(
    editItem?.cycleTime ?? editItem?.standardCycleTime ?? ''
  );
  const [partWeight, setPartWeight] = useState<number | string>(
    editItem?.partWeightGrams ?? editItem?.netWeightGrams ?? ''
  );
  const [cavityCount, setCavityCount] = useState<number | string>(
    editItem?.cavityCount ?? 1
  );
  const [runnerWeight, setRunnerWeight] = useState<number | string>(
    editItem?.runnerWeightGrams ?? 0
  );
  const [moldTool, setMoldTool] = useState<string>(editItem?.moldToolId || 'MOLD-001');

  // Computed Shot Weight Formula: Part Weight + Runner Weight = Single Shot Weight
  const numPartWeight = Number(partWeight) || 0;
  const numRunnerWeight = Number(runnerWeight) || 0;
  const numCavities = Number(cavityCount) || 1;
  const calculatedSingleShotWeight = Number((numPartWeight + numRunnerWeight).toFixed(2));
  const calculatedTotalShotWeight = Number(((numPartWeight * numCavities) + numRunnerWeight).toFixed(2));

  // Step 3: Units & Conversions
  const [baseUOM, setBaseUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [purchaseUOM, setPurchaseUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [salesUOM, setSalesUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [stockUOM, setStockUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [productionUOM, setProductionUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [conversions, setConversions] = useState<ConversionRow[]>([]);

  // Step 4: Manufacturing Attributes & Dynamic Specs
  const [resinType, setResinType] = useState<string>(editItem?.resinType || '');
  const [polymerGrade, setPolymerGrade] = useState<string>(editItem?.polymerGrade || '');
  const [color, setColor] = useState<string>(editItem?.color || '');
  const [mfi, setMfi] = useState<string>(editItem?.mfi || '');
  const [density, setDensity] = useState<string>(editItem?.density || '');
  const [additivePercentage, setAdditivePercentage] = useState<string>('');
  const [masterbatchDosage, setMasterbatchDosage] = useState<string>(editItem?.masterbatchDosage || '');
  const [carrierResin, setCarrierResin] = useState<string>(editItem?.carrierResin || 'Universal PE/PP Carrier');
  const [heatStability, setHeatStability] = useState<string>(editItem?.heatStability || '280°C');
  const [boxDimensions, setBoxDimensions] = useState<string>(editItem?.boxDimensions || '600 x 400 x 350 mm');
  const [unitsPerPack, setUnitsPerPack] = useState<number | string>(editItem?.unitsPerPack || 250);
  const [machineFitment, setMachineFitment] = useState<string>(editItem?.machineCompat || 'All Injection Machines');
  const [spareClass, setSpareClass] = useState<string>('Critical Tooling Spare');
  const [regrindAllowance, setRegrindAllowance] = useState<string>(editItem?.regrind || '');
  const [moistureSensitive, setMoistureSensitive] = useState<boolean>(editItem?.moistureSensitive ?? false);
  const [processingMethod, setProcessingMethod] = useState<string>('Injection Molding');

  // Step 5: Inventory Settings
  const [lotControlled, setLotControlled] = useState<boolean>(editItem?.lot ?? true);
  const [expiryControlled, setExpiryControlled] = useState<boolean>(false);
  const [fefoPicking, setFefoPicking] = useState<boolean>(false);
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(0);
  const [defaultWarehouse, setDefaultWarehouse] = useState<string>(editItem?.wh || (selectedType === 'Raw Material' ? 'RM-WH-01' : 'FG-WH-01'));
  const [defaultBin, setDefaultBin] = useState<string>(editItem?.locationCode || '');
  const [reorderLevel, setReorderLevel] = useState<number>(
    editItem?.reorderLevel ? parseInt(editItem.reorderLevel) : 0
  );
  const [safetyStock, setSafetyStock] = useState<number>(
    editItem?.safetyStock ? parseInt(editItem.safetyStock) : 0
  );

  // Post-Molding Routing Destination Checkboxes: WIP (Default for FG), DOL, ASSEMBLY, DEFLASH
  const initialRouting: 'WIP' | 'DOL' | 'ASSEMBLY' | 'DEFLASH' = editItem?.routingDestination ||
    (editItem?.isWip ? 'WIP' : editItem?.isDeflash ? 'DEFLASH' : editItem?.isAssembly ? 'ASSEMBLY' : editItem?.isDol ? 'DOL' : 'WIP');

  const [routingDestination, setRoutingDestination] = useState<'WIP' | 'DOL' | 'ASSEMBLY' | 'DEFLASH'>(initialRouting);
  const [isWip, setIsWip] = useState<boolean>(editItem?.isWip ?? (initialRouting === 'WIP'));
  const [isDol, setIsDol] = useState<boolean>(editItem?.isDol ?? (initialRouting === 'DOL'));
  const [isAssembly, setIsAssembly] = useState<boolean>(editItem?.isAssembly ?? (initialRouting === 'ASSEMBLY'));
  const [isDeflash, setIsDeflash] = useState<boolean>(editItem?.isDeflash ?? (initialRouting === 'DEFLASH'));

  const handleToggleWip = (checked: boolean) => {
    if (checked) {
      setIsWip(true);
      setIsDol(false);
      setIsAssembly(false);
      setIsDeflash(false);
      setRoutingDestination('WIP');
      if (selectedType === 'Finished Good') {
        setDefaultWarehouse('WIP-WH-01');
      }
    } else {
      setIsWip(false);
      setIsDol(true);
      setRoutingDestination('DOL');
    }
  };

  const handleToggleDol = (checked: boolean) => {
    if (checked) {
      setIsWip(false);
      setIsDol(true);
      setIsAssembly(false);
      setIsDeflash(false);
      setRoutingDestination('DOL');
      if (selectedType === 'Finished Good') {
        setDefaultWarehouse('FG-WH-01');
      }
    } else {
      setIsDol(false);
      setIsWip(true);
      setRoutingDestination('WIP');
    }
  };

  const handleToggleAssembly = (checked: boolean) => {
    if (checked) {
      setIsWip(false);
      setIsDol(false);
      setIsAssembly(true);
      setIsDeflash(false);
      setRoutingDestination('ASSEMBLY');
    } else {
      setIsAssembly(false);
      setIsWip(true);
      setRoutingDestination('WIP');
    }
  };

  const handleToggleDeflash = (checked: boolean) => {
    if (checked) {
      setIsWip(false);
      setIsDol(false);
      setIsAssembly(false);
      setIsDeflash(true);
      setRoutingDestination('DEFLASH');
    } else {
      setIsDeflash(false);
      setIsWip(true);
      setRoutingDestination('WIP');
    }
  };

  // Step 6: Quality Settings
  const [iqcMandatory, setIqcMandatory] = useState<boolean>(editItem?.qc ?? false);
  const [coaRequired, setCoaRequired] = useState<boolean>(false);
  const [samplingPlan, setSamplingPlan] = useState<string>('ISO 2859-1 Level II Normal');
  const [approvedLab, setApprovedLab] = useState<string>('');
  const [qualityTestParams, setQualityTestParams] = useState<string[]>([]);

  // Step 7: Purchasing
  const [preferredSupplier, setPreferredSupplier] = useState<string>(
    editItem?.supplier || ''
  );
  const [standardPurchasePrice, setStandardPurchasePrice] = useState<number>(0);
  const [hsnCode, setHsnCode] = useState<string>(editItem?.hsCode || '');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(editItem?.leadTime ? parseInt(editItem.leadTime) : 0);
  const [purchaseMoq, setPurchaseMoq] = useState<number>(0);
  const [gstRate, setGstRate] = useState<string>('18%');

  // Step 8: Sales
  const [standardSalesPrice, setStandardSalesPrice] = useState<number>(0);
  const [priceTier, setPriceTier] = useState<string>('Tier 1 OEM Standard');
  const [salesMoq, setSalesMoq] = useState<number>(0);
  const [packagingStandard, setPackagingStandard] = useState<string>('');

  // Step 9: Documents
  const [documents, setDocuments] = useState<
    { name: string; type: string; size: string; uploadedOn: string; url?: string }[]
  >([]);
  const [isDocDragging, setIsDocDragging] = useState<boolean>(false);

  // Step 10: Review & Workflow
  const [workflowRoute, setWorkflowRoute] = useState<string>(
    'Multi-Tier: Engineering Author -> QA Lead -> Plant Operations Manager'
  );
  const [workflowPriority, setWorkflowPriority] = useState<'Normal' | 'Urgent' | 'Expedited'>('Normal');
  const [creationNotes, setCreationNotes] = useState<string>('');

  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [existingDraftFound, setExistingDraftFound] = useState<any | null>(null);

  // Reset form or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setSelectedType(editItem.type || 'Finished Good');
        setItemCode(editItem.code || '');
        setItemName(editItem.name || '');
        setCategory(editItem.cat || '');
        setDescription(editItem.desc || '');
        setCycleTime(editItem.cycleTime ?? editItem.standardCycleTime ?? '');
        setPartWeight(editItem.partWeightGrams ?? editItem.netWeightGrams ?? '');
        setCavityCount(editItem.cavityCount ?? 1);
        setRunnerWeight(editItem.runnerWeightGrams ?? 0);
        setBaseUOM(editItem.baseUOM || 'PCS');
        setResinType(editItem.resinType || '');
        setMfi(editItem.mfi || '');
        setDensity(editItem.density || '');
        setDefaultWarehouse(editItem.wh || '');
        setDefaultBin(editItem.locationCode || '');
        setReorderLevel(editItem.reorderLevel ? parseInt(editItem.reorderLevel) : 0);
        setSafetyStock(editItem.safetyStock ? parseInt(editItem.safetyStock) : 0);
        setPreferredSupplier(editItem.supplier || '');
        setHsnCode(editItem.hsCode || '');
        setLeadTimeDays(editItem.leadTime ? parseInt(editItem.leadTime) : 0);
        setDocuments((editItem.documents as any) || []);
        setMoldTool(editItem.moldToolId || 'MOLD-001');
      } else {
        // Clean blank slate for new live item entry
        setCurrentStep(1);
        setItemName('');
        setCategory('');
        setItemGroup('');
        setDescription('');
        setCycleTime('');
        setPartWeight('');
        setCavityCount(1);
        setRunnerWeight(0);
        setConversions([]);
        setResinType('');
        setPolymerGrade('');
        setColor('');
        setMfi('');
        setDensity('');
        setAdditivePercentage('');
        setMasterbatchDosage('');
        setRegrindAllowance('');
        setMoistureSensitive(false);
        setLotControlled(true);
        setExpiryControlled(false);
        setFefoPicking(false);
        setShelfLifeDays(0);
        setDefaultWarehouse(selectedType === 'Raw Material' ? 'RM-WH-01' : 'FG-WH-01');
        setDefaultBin('');
        setReorderLevel(0);
        setSafetyStock(0);
        setIsWip(selectedType === 'Finished Good');
        setIsDol(false);
        setIsAssembly(false);
        setIsDeflash(false);
        setRoutingDestination(selectedType === 'Finished Good' ? 'WIP' : 'DOL');
        setIqcMandatory(false);
        setCoaRequired(false);
        setApprovedLab('');
        setQualityTestParams([]);
        setPreferredSupplier('');
        setStandardPurchasePrice(0);
        setDocuments([]);
        setIsDocDragging(false);
        setMoldTool('MOLD-001');
        setHsnCode('');
        setLeadTimeDays(0);
        setPurchaseMoq(0);
        setStandardSalesPrice(0);
        setSalesMoq(0);
        setPackagingStandard('');
        setDocuments([]);
        setCreationNotes('');
      }
    }
  }, [isOpen, editItem]);

  // 30-Second Auto-save Timer Execution
  useEffect(() => {
    if (!isOpen) return;

    const performAutoSave = () => {
      setIsAutoSaving(true);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const draftPayload = {
        selectedType,
        itemCode,
        itemName,
        category,
        itemGroup,
        status,
        description,
        cycleTime,
        partWeight,
        cavityCount,
        runnerWeight,
        baseUOM,
        purchaseUOM,
        salesUOM,
        stockUOM,
        productionUOM,
        resinType,
        polymerGrade,
        color,
        mfi,
        density,
        defaultWarehouse,
        defaultBin,
        reorderLevel,
        safetyStock,
        leadTimeDays,
        preferredSupplier,
        hsnCode,
        routingDestination,
        isWip,
        isDol,
        isAssembly,
        isDeflash,
        currentStep,
        savedAt: timeStr,
      };

      try {
        localStorage.setItem('reboot_erp_item_draft_auto', JSON.stringify(draftPayload));
      } catch (err) {
        console.warn('Auto-save write error', err);
      }

      setLastAutoSaveTime(timeStr);
      setTimeout(() => setIsAutoSaving(false), 1200);
    };

    // Trigger auto-save every 30 seconds
    const timer = setInterval(performAutoSave, 30000);
    return () => clearInterval(timer);
  }, [
    isOpen,
    selectedType,
    itemCode,
    itemName,
    category,
    itemGroup,
    status,
    description,
    cycleTime,
    partWeight,
    cavityCount,
    runnerWeight,
    baseUOM,
    purchaseUOM,
    salesUOM,
    stockUOM,
    productionUOM,
    resinType,
    polymerGrade,
    color,
    mfi,
    density,
    defaultWarehouse,
    defaultBin,
    reorderLevel,
    safetyStock,
    leadTimeDays,
    preferredSupplier,
    hsnCode,
    routingDestination,
    isWip,
    isDol,
    isAssembly,
    isDeflash,
    currentStep,
  ]);

  if (!isOpen) return null;

  // Item Types List with Icons
  const itemTypesList: { type: ItemType; label: string; desc: string; icon: React.FC<any> }[] = [
    { type: 'Raw Material', label: 'Raw Material', desc: 'Resins and compounds bought by weight', icon: FlaskConical },
    { type: 'Additive', label: 'Additive', desc: 'Standard master record', icon: Fuel },
    { type: 'Masterbatch', label: 'Masterbatch', desc: 'Standard master record', icon: Palette },
    { type: 'Colorant', label: 'Colorant', desc: 'Standard master record', icon: Droplet },
    { type: 'Regrind', label: 'Regrind', desc: 'Reprocessed in-house material', icon: RefreshCw },
    { type: 'Semi-Finished Good', label: 'Semi-Finished Good', desc: 'Standard master record', icon: Layers },
    { type: 'Finished Good', label: 'Finished Good', desc: 'Standard master record', icon: Box },
    { type: 'Packaging Material', label: 'Packaging Material', desc: 'Standard master record', icon: Package },
    { type: 'Spare Part', label: 'Spare Part', desc: 'Machine and mold spares', icon: Wrench },
    { type: 'Consumable', label: 'Consumable', desc: 'Standard master record', icon: Fuel },
  ];

  const steps = [
    { id: 1, label: 'Item type' },
    { id: 2, label: 'Basic information' },
    { id: 3, label: 'Units & conversions' },
    { id: 4, label: 'Manufacturing attributes' },
    { id: 5, label: 'Inventory settings' },
    { id: 6, label: 'Quality settings' },
    { id: 7, label: 'Purchasing' },
    { id: 8, label: 'Sales' },
    { id: 9, label: 'Documents' },
    { id: 10, label: 'Review & submit' },
  ];

  const handleNext = () => {
    if (currentStep >= 2) {
      if (!itemCode.trim()) {
        setItemCodeError(true);
        setCurrentStep(2);
        showToast('Item Code cannot be empty. Please enter or select a valid Item Code before proceeding.');
        return;
      }
      if (!itemName.trim()) {
        setCurrentStep(2);
        showToast('Item Name cannot be empty. Please enter an Item Name before proceeding.');
        return;
      }
      if (duplicateCodeMatch.isDuplicate) {
        setItemCodeError(true);
        setCurrentStep(2);
        showToast(`Cannot proceed: Item Code "${itemCode}" already exists. Duplicate item codes are strictly prohibited.`);
        return;
      }
      if (duplicateNameMatch.isDuplicate) {
        setCurrentStep(2);
        showToast(`Cannot proceed: Item Name "${itemName}" already exists. Duplicate item names are strictly prohibited.`);
        return;
      }
    }
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddConversion = () => {
    setConversions([
      ...conversions,
      { id: Date.now().toString(), from: baseUOM, to: 'Custom Unit', factor: 1.0 },
    ]);
  };

  const handleRemoveConversion = (id: string) => {
    setConversions(conversions.filter((c) => c.id !== id));
  };

  const handleSaveDraft = () => {
    if (!itemCode.trim()) {
      setItemCodeError(true);
      setCurrentStep(2);
      showToast('Item Code cannot be empty when saving draft.');
      return;
    }
    if (duplicateCodeMatch.isDuplicate) {
      setItemCodeError(true);
      setCurrentStep(2);
      showToast(`Cannot save draft: Item Code "${itemCode}" is already in use.`);
      return;
    }
    if (itemName.trim() && duplicateNameMatch.isDuplicate) {
      setCurrentStep(2);
      showToast(`Cannot save draft: Item Name "${itemName}" is already in use.`);
      return;
    }

    const isFgItem = selectedType === 'Finished Good' || selectedType === 'Semi-Finished Good';

    const draftItem: ItemMaster = {
      code: itemCode.trim().toUpperCase(),
      name: itemName.trim() || 'Untitled Draft Item',
      type: selectedType,
      cat: category,
      itemGroup: itemGroup,
      stock: `0 ${baseUOM}`,
      avail: `0 ${baseUOM}`,
      wh: defaultWarehouse,
      lot: lotControlled,
      qc: iqcMandatory,
      status: 'inactive',
      icon: isFgItem ? '▣' : selectedType === 'Masterbatch' || selectedType === 'Colorant' ? '●' : selectedType === 'Spare Part' ? '🔧' : '◇',
      baseUOM,
      approval: 'draft',
      createdOn: 'Today',
      standardCycleTime: isFgItem ? (Number(cycleTime) || 24.5) : 0,
      cycleTime: isFgItem ? (Number(cycleTime) || 0) : 0,
      partWeightGrams: isFgItem ? numPartWeight : undefined,
      cavityCount: isFgItem ? numCavities : undefined,
      runnerWeightGrams: isFgItem ? numRunnerWeight : undefined,
      shotWeightGrams: isFgItem ? calculatedSingleShotWeight : undefined,
      netWeightGrams: isFgItem ? numPartWeight : undefined,
      locationCode: defaultBin,
      desc: description,
      resinType,
      polymerGrade,
      color,
      mfi,
      density,
      masterbatchDosage,
      carrierResin,
      heatStability,
      packagingStandard,
      boxDimensions,
      machineCompat: machineFitment,
      regrind: regrindAllowance,
      reorderLevel: reorderLevel.toString(),
      safetyStock: safetyStock.toString(),
      leadTime: `${leadTimeDays}d`,
      supplier: preferredSupplier,
      hsCode: hsnCode,
      moistureSensitive,
      routingDestination,
      isWip,
      isDol,
      isAssembly,
      isDeflash,
      moldToolId: isFgItem ? (moldTool || 'MOLD-001') : undefined,
      documents: documents.length > 0 ? documents : editItem?.documents || [],
    };
    onSaveItem(draftItem);
    showToast(`Draft item ${draftItem.code} saved successfully.`);
    onClose();
  };

  const handleSubmitFinal = (isApprovedDirectly = false) => {
    if (!itemCode.trim()) {
      setItemCodeError(true);
      showToast('Item Code is required before submitting.');
      setCurrentStep(2);
      return;
    }
    if (!itemName.trim()) {
      showToast('Item Name is required before submitting.');
      setCurrentStep(2);
      return;
    }
    if (duplicateCodeMatch.isDuplicate) {
      setItemCodeError(true);
      setCurrentStep(2);
      showToast(`Cannot submit: Item Code "${itemCode}" already exists in the system.`);
      return;
    }
    if (duplicateNameMatch.isDuplicate) {
      setCurrentStep(2);
      showToast(`Cannot submit: Item Name "${itemName}" is already used by SKU ${duplicateNameMatch.item?.code}.`);
      return;
    }

    const isFgItem = selectedType === 'Finished Good' || selectedType === 'Semi-Finished Good';

    const finalItem: ItemMaster = {
      code: itemCode.trim().toUpperCase(),
      name: itemName.trim(),
      type: selectedType,
      cat: category,
      itemGroup: itemGroup,
      stock: editItem?.stock || `0 ${baseUOM}`,
      avail: editItem?.avail || `0 ${baseUOM}`,
      wh: defaultWarehouse,
      lot: lotControlled,
      qc: iqcMandatory,
      status: 'active',
      icon: isFgItem ? '▣' : selectedType === 'Masterbatch' || selectedType === 'Colorant' ? '●' : selectedType === 'Spare Part' ? '🔧' : '◇',
      baseUOM,
      approval: isApprovedDirectly ? 'approved' : 'pending',
      createdOn: editItem?.createdOn || 'Today',
      standardCycleTime: isFgItem ? (Number(cycleTime) || 24.5) : 0,
      cycleTime: isFgItem ? (Number(cycleTime) || 0) : 0,
      partWeightGrams: isFgItem ? numPartWeight : undefined,
      cavityCount: isFgItem ? numCavities : undefined,
      runnerWeightGrams: isFgItem ? numRunnerWeight : undefined,
      shotWeightGrams: isFgItem ? calculatedSingleShotWeight : undefined,
      netWeightGrams: isFgItem ? numPartWeight : undefined,
      cycleTimeUOM: isFgItem ? 'sec/pc' : undefined,
      locationCode: defaultBin,
      desc: description,
      resinType,
      polymerGrade,
      color,
      mfi,
      density,
      masterbatchDosage,
      carrierResin,
      heatStability,
      packagingStandard,
      boxDimensions,
      machineCompat: machineFitment,
      regrind: regrindAllowance,
      reorderLevel: reorderLevel.toString(),
      safetyStock: safetyStock.toString(),
      leadTime: `${leadTimeDays}d`,
      supplier: preferredSupplier,
      hsCode: hsnCode,
      moistureSensitive,
      routingDestination,
      isWip,
      isDol,
      isAssembly,
      isDeflash,
      moldToolId: isFgItem ? (moldTool || 'MOLD-001') : undefined,
      documents: documents.length > 0 ? documents : editItem?.documents || [],
    };

    onSaveItem(finalItem);
    showToast(
      isApprovedDirectly
        ? `Item ${finalItem.code} released directly to Active Master catalog.`
        : `Item ${finalItem.code} submitted for ${workflowRoute.split(':')[0]} approval.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl min-h-[640px] flex flex-col overflow-hidden my-auto animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {editItem ? `Edit item — ${editItem.code}` : 'Create item'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Guided setup — fields adapt to the selected item type. Draft auto-saves every 30 seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save as draft
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Wizard Main Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 bg-slate-50/50">
          {/* Left Column: Vertical Stepper & Auto-Save */}
          <div className="p-5 border-r border-slate-200 bg-white flex flex-col justify-between">
            <div className="space-y-4">
              {/* Progress Bar & Step Counter */}
              <div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#0066CC] h-full transition-all duration-300"
                    style={{ width: `${(currentStep / 10) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-2 font-semibold">
                  Step {currentStep} of 10
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-1">
                {steps.map((s) => {
                  const isCompleted = currentStep > s.id;
                  const isActive = currentStep === s.id;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (s.id > 2) {
                            if (!itemCode.trim()) {
                              setItemCodeError(true);
                              setCurrentStep(2);
                              showToast('Item Code cannot be empty. Please enter an item code before navigating.');
                              return;
                            }
                            if (!itemName.trim()) {
                              setCurrentStep(2);
                              showToast('Item Name cannot be empty. Please enter an item name before navigating.');
                              return;
                            }
                            if (duplicateCodeMatch.isDuplicate) {
                              setItemCodeError(true);
                              setCurrentStep(2);
                              showToast(`Cannot proceed: Item Code "${itemCode}" already exists.`);
                              return;
                            }
                            if (duplicateNameMatch.isDuplicate) {
                              setCurrentStep(2);
                              showToast(`Cannot proceed: Item Name "${itemName}" already exists.`);
                              return;
                            }
                          }
                          setCurrentStep(s.id);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                          isActive
                            ? 'bg-[#F0F7FF] text-[#0066CC] font-bold shadow-xs'
                            : isCompleted
                            ? 'text-slate-700 font-medium hover:bg-slate-50'
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                          isActive
                            ? 'bg-[#0066CC] text-white'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'border border-slate-300 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3 h-3" /> : s.id}
                      </div>
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Left Timestamp Status with active auto-save indicator */}
            <div className="pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isAutoSaving ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className="truncate">
                {isAutoSaving
                  ? 'Auto-saving progress...'
                  : `Auto-saved ${lastAutoSaveTime} • draft ${itemCode}`}
              </span>
            </div>
          </div>

          {/* Right Column (3 Cols): Main Step Form Content */}
          <div className="md:col-span-3 p-6 flex flex-col justify-between overflow-y-auto max-h-[640px] bg-white">
            <div className="space-y-5">
              {/* Draft Restoration Banner if found */}
              {existingDraftFound && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Unsaved draft detected:</strong> "{existingDraftFound.itemCode || 'Untitled'}" (Saved at {existingDraftFound.savedAt || 'recently'}).
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      Resume Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
              {/* ========================================================= */}
              {/* STEP 1: ITEM TYPE                                         */}
              {/* ========================================================= */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Item type</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {itemTypesList.map((itm) => {
                      const Icon = itm.icon;
                      const isSelected = selectedType === itm.type;

                      return (
                        <button
                          key={itm.type}
                          type="button"
                          onClick={() => setSelectedType(itm.type)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-[#0066CC] bg-[#F0F7FF]/60 ring-2 ring-[#0066CC]/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isSelected ? 'bg-[#0066CC] text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{itm.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {itm.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 2: BASIC INFORMATION                                 */}
              {/* ========================================================= */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Basic information</h2>
                      <p className="text-[11px] text-slate-500">
                        Item identification and classification. Entering an existing Master Code will auto-fill category, name, and item group.
                      </p>
                    </div>
                    {syncedMasterRecord ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                        Admin Master Synced
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenNewMasterModal()}
                        className="text-xs text-[#0F8B8D] hover:text-[#0c7274] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-50 transition-colors cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5" />
                        + New Master Data Record
                      </button>
                    )}
                  </div>

                  {/* Synced Master Record Status Banner */}
                  {syncedMasterRecord && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-900 text-xs">
                              Auto-filled from Admin Master Data
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900 text-[10px] font-mono font-bold">
                              {syncedMasterRecord.code}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 text-[10px] font-medium">
                              {syncedMasterRecord.entityType}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            Category: <strong className="text-emerald-950">{syncedMasterRecord.category}</strong> &bull; Item Group: <strong className="text-emerald-950">{syncedMasterRecord.itemGroup || 'General'}</strong> &bull; UOM: <strong className="font-mono text-emerald-950">{syncedMasterRecord.primaryUom}</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSyncedMasterRecord(null)}
                        className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline px-2 py-1 cursor-pointer shrink-0"
                      >
                        Unlink
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Item Code + Auto-generate toggle + Combobox */}
                    <div className="relative" ref={codeDropdownRef}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          Item code *
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenNewMasterModal(itemCode)}
                            className="text-[11px] text-[#0F8B8D] hover:text-[#0c7274] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            + New Master Code
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={itemCode}
                          onChange={(e) => handleItemCodeChange(e.target.value)}
                          onFocus={() => setShowCodeDropdown(true)}
                          className={`w-full pl-3 pr-8 py-2 rounded-lg border font-mono text-xs transition-colors ${
                            (itemCodeError && !itemCode.trim()) || duplicateCodeMatch.isDuplicate
                              ? 'border-rose-500 bg-rose-50/40 text-rose-950 font-bold ring-2 ring-rose-200 focus:ring-rose-400'
                              : syncedMasterRecord
                              ? 'border-emerald-400 bg-emerald-50/30 text-emerald-950 font-bold focus:ring-1 focus:ring-emerald-500'
                              : 'border-slate-300 focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D]'
                          }`}
                          placeholder="e.g. FG-BMP-NEXON-F or type to search catalog..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowCodeDropdown(!showCodeDropdown)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Lookup Master Data"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {itemCodeError && !itemCode.trim() && (
                        <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 animate-fade-in">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          Item Code is required before moving to next steps.
                        </p>
                      )}

                      {duplicateCodeMatch.isDuplicate && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] mt-1.5 flex items-start gap-2 animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-rose-900">Duplicate Item Code:</span>
                            <p className="mt-0.5 text-rose-700">
                              Item code <strong>"{itemCode}"</strong> already exists in Item Master ({duplicateCodeMatch.item?.approval === 'pending' ? 'Waiting for Approval' : duplicateCodeMatch.item?.approval === 'rejected' ? 'Rejected Item' : 'Active Catalog SKU'}). Duplicate item codes are strictly prohibited.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Dropdown Menu for Master Data lookup / create */}
                      {showCodeDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col">
                          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <Database className="w-3.5 h-3.5 text-[#0F8B8D]" />
                              {filterAllTypes ? 'All Master Catalog Parts' : `${selectedType} Parts Only`}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFilterAllTypes(!filterAllTypes);
                                }}
                                className="text-[10px] font-medium text-[#0F8B8D] hover:underline normal-case"
                              >
                                {filterAllTypes ? `Filter ${selectedType} only` : 'Show all catalog'}
                              </button>
                              <span className="text-slate-400">({filteredMasterCodes.length})</span>
                            </div>
                          </div>

                          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-56">
                            {filteredMasterCodes.length > 0 ? (
                              filteredMasterCodes.map((rec) => (
                                <button
                                  key={rec.id}
                                  type="button"
                                  onClick={() => handleApplyMasterRecord(rec)}
                                  className="w-full text-left px-3 py-2.5 hover:bg-teal-50/50 transition-colors flex items-start justify-between gap-2 group cursor-pointer"
                                >
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono font-bold text-slate-900 group-hover:text-[#0F8B8D] text-xs">
                                        {rec.code}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        {rec.entityType}
                                      </span>
                                      {rec.resinType && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                          Resin: {rec.resinType}
                                        </span>
                                      )}
                                      {rec.color && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                          Color: {rec.color}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium line-clamp-1">{rec.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                      <span>Cat: <strong className="text-slate-700">{rec.category}</strong></span>
                                      <span>&bull;</span>
                                      <span>Group: <strong className="text-slate-700">{rec.itemGroup || 'General'}</strong></span>
                                      <span>&bull;</span>
                                      <span className="font-mono">{rec.primaryUom}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-[#0F8B8D] font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap self-center bg-teal-50 px-2 py-1 rounded border border-teal-200">
                                    Auto-fill &rarr;
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center">
                                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                                  <Database className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-semibold text-slate-800">
                                  {itemCode ? `Code "${itemCode}" not found` : `No ${selectedType} master records found`}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                                  {filterAllTypes
                                    ? 'Create this code under Admin Master Data to register it and auto-fill details.'
                                    : `Currently filtered to "${selectedType}". Toggle to show all catalog or create a new record.`}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                  {!filterAllTypes && (
                                    <button
                                      type="button"
                                      onClick={() => setFilterAllTypes(true)}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                                    >
                                      Search All Types
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenNewMasterModal(itemCode)}
                                    className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    + Register in Master Data
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleOpenNewMasterModal(itemCode)}
                              className="text-xs text-[#0F8B8D] hover:text-[#0c7274] font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-teal-50/50 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              + New Master Data Record
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCodeDropdown(false)}
                              className="text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">Item name *</label>
                        {syncedMasterRecord && (
                          <span className="text-[10px] text-emerald-700 font-medium">✓ Auto-filled</span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:ring-1 focus:ring-[#0066CC] ${
                          duplicateNameMatch.isDuplicate
                            ? 'border-rose-500 bg-rose-50/40 text-rose-950 font-bold ring-2 ring-rose-200'
                            : syncedMasterRecord
                            ? 'border-emerald-300 bg-emerald-50/10'
                            : 'border-slate-300'
                        }`}
                        placeholder="e.g. PP Natural Granules"
                      />
                      {duplicateNameMatch.isDuplicate && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] mt-1.5 flex items-start gap-2 animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-rose-900">Duplicate Item Name:</span>
                            <p className="mt-0.5 text-rose-700">
                              Item name <strong>"{itemName}"</strong> is already in use by SKU <strong>{duplicateNameMatch.item?.code}</strong> ({duplicateNameMatch.item?.approval === 'pending' ? 'Waiting for Approval' : duplicateNameMatch.item?.approval === 'rejected' ? 'Rejected Item' : 'Active Catalog SKU'}). Duplicate item names are strictly prohibited.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Category (Task 1: Autocomplete & Dropdown with Admin + Add) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">Classification / Category *</label>
                        {syncedMasterRecord && (
                          <span className="text-[10px] text-emerald-700 font-medium">✓ Auto-filled</span>
                        )}
                      </div>
                      <MasterDataCombobox
                        value={category}
                        onChange={(val) => setCategory(val)}
                        options={categoryList}
                        placeholder="Select or type Category..."
                        entityLabel="Category"
                        onSaveCustomOption={(newVal) => {
                          const updated = masterDataGovernanceService.saveCategory(newVal);
                          setCategoryList(updated);
                          showToast(`✓ Category "${newVal}" registered in Admin Master Catalog!`);
                        }}
                      />
                    </div>

                    {/* Item Group (Task 1: Autocomplete & Dropdown with Admin + Add) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">Item Group *</label>
                        {syncedMasterRecord && (
                          <span className="text-[10px] text-emerald-700 font-medium">✓ Auto-filled</span>
                        )}
                      </div>
                      <MasterDataCombobox
                        value={itemGroup}
                        onChange={(val) => setItemGroup(val)}
                        options={itemGroupList}
                        placeholder="Select or type Item Group..."
                        entityLabel="Item Group"
                        onSaveCustomOption={(newVal) => {
                          const updated = masterDataGovernanceService.saveItemGroup(newVal);
                          setItemGroupList(updated);
                          showToast(`✓ Item Group "${newVal}" registered in Admin Master Catalog!`);
                        }}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Quarantine Hold">Quarantine Hold</option>
                        <option value="Obsolete">Obsolete</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        placeholder="Grade, application and processing notes"
                      />
                    </div>

                    {/* ========================================================================= */}
                    {/* DYNAMIC TECHNICAL & PROCESS PARAMETERS CARD (BASED ON SELECTED ITEM TYPE) */}
                    {/* ========================================================================= */}
                    {(selectedType === 'Finished Good' || selectedType === 'Semi-Finished Good') && (
                      <div className="md:col-span-2 p-4 bg-gradient-to-br from-blue-50/70 via-slate-50 to-teal-50/40 rounded-xl border border-blue-200/80 shadow-xs space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#0066CC] text-white flex items-center justify-center font-bold text-xs">
                              <Box className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xs text-slate-900">
                                {selectedType} &mdash; Injection Molding Tooling &amp; Process Parameters
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Core rheology, cycle timing, mold cavity metrics, and automatic shot weight balancing.
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#0066CC] border border-blue-200">
                            Mold Spec Gate
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* Cycle Time */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Cycle Time <span className="text-slate-400 font-normal">(seconds)</span> *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="1"
                                required
                                value={cycleTime}
                                onChange={(e) => setCycleTime(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-[#0066CC] bg-white"
                                placeholder="e.g. 24.5"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 font-semibold">
                                sec
                              </span>
                            </div>
                          </div>

                          {/* Part Weight */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Part Weight <span className="text-slate-400 font-normal">(grams/pc)</span> *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0.1"
                                required
                                value={partWeight}
                                onChange={(e) => setPartWeight(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-[#0066CC] bg-white"
                                placeholder="e.g. 142.5"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 font-semibold">
                                g
                              </span>
                            </div>
                          </div>

                          {/* Cavity Count */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Mold Cavities <span className="text-slate-400 font-normal">(count)</span> *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="128"
                                required
                                value={cavityCount}
                                onChange={(e) => setCavityCount(e.target.value)}
                                className="w-full pl-3 pr-12 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-[#0066CC] bg-white"
                                placeholder="e.g. 2"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 font-semibold">
                                cav
                              </span>
                            </div>
                          </div>

                          {/* Runner Weight */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Runner Weight <span className="text-slate-400 font-normal">(grams)</span> *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={runnerWeight}
                                onChange={(e) => setRunnerWeight(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-[#0066CC] bg-white"
                                placeholder="e.g. 18.0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 font-semibold">
                                g
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Calculated Shot Weight Dynamic Readout & Formula Banner */}
                        <div className="p-3 bg-white rounded-xl border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
                                Calculated Shot Weight:
                              </span>
                              <span className="font-mono text-sm font-bold text-[#0066CC] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {calculatedSingleShotWeight} g / pc shot
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {calculatedTotalShotWeight} g (Total {numCavities}-Cavity Shot)
                              </span>
                            </div>

                            {/* Mathematical formula badge */}
                            <div className="font-mono text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-700">Formula:</span>
                              <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-800">
                                Part Weight ({numPartWeight}g) + Runner Weight ({numRunnerWeight}g) = {calculatedSingleShotWeight}g
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-800">
                                ({numPartWeight}g &times; {numCavities} Cavities) + {numRunnerWeight}g = {calculatedTotalShotWeight}g Total Mold Shot
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right font-mono text-[11px] text-slate-500">
                            <div>Est. Hourly Output:</div>
                            <strong className="text-slate-900 text-xs">
                              {Number(cycleTime) > 0
                                ? Math.round((3600 / Number(cycleTime)) * numCavities).toLocaleString()
                                : 0}{' '}
                              pcs / hr
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Card for Raw Material / Regrind */}
                    {(selectedType === 'Raw Material' || selectedType === 'Regrind') && (
                      <div className="md:col-span-2 p-4 bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/40 rounded-xl border border-emerald-200/80 shadow-xs space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                              <FlaskConical className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xs text-slate-900">
                                {selectedType} &mdash; Polymer Feedstock &amp; Rheology Specifications
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Base polymer grade, melt flow index (MFI), density gradient, and virgin/regrind blending limits.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            RESIN FEEDSTOCK GATE
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Resin Type / Polymer Family *</label>
                            <MasterDataCombobox
                              value={resinType}
                              onChange={(val) => setResinType(val)}
                              options={resinTypeList}
                              placeholder="Select Resin..."
                              entityLabel="Resin Type"
                              onSaveCustomOption={(newVal) => {
                                const updated = masterDataGovernanceService.saveResinType(newVal);
                                setResinTypeList(updated);
                                showToast(`✓ Resin "${newVal}" registered!`);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Polymer Grade / Code</label>
                            <input
                              type="text"
                              value={polymerGrade}
                              onChange={(e) => setPolymerGrade(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                              placeholder="e.g. Repol H110MA / Sabic 500P"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Melt Flow Index (g/10min)</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={mfi}
                                onChange={(e) => setMfi(e.target.value)}
                                className="w-full pl-3 pr-14 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                                placeholder="e.g. 11.0"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">g/10min</span>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Density (g/cm³)</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={density}
                                onChange={(e) => setDensity(e.target.value)}
                                className="w-full pl-3 pr-12 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                                placeholder="e.g. 0.905"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">g/cm³</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Rheology Balance:
                              </span>
                              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                MFI {mfi || '11.0'} &bull; Density {density || '0.905'} g/cm³
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="text-slate-700 font-semibold text-[11px]">
                                Regrind Limit: <strong className="font-mono text-emerald-900">{regrindAllowance || '20'}%</strong>
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-600">
                              Material Grade: <strong className="text-slate-800">{polymerGrade || 'Virgin Polymer'}</strong> ({resinType || 'Polypropylene'}) &bull; Pre-drying: {moistureSensitive ? 'Mandatory (80°C / 2h)' : 'Standard ambient'}
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono text-[11px] text-slate-500">
                            <div>Stocking Base UOM:</div>
                            <strong className="text-emerald-900 text-xs font-bold">KG (Kilograms)</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Card for Masterbatch / Colorant / Additive */}
                    {(selectedType === 'Masterbatch' || selectedType === 'Colorant' || selectedType === 'Additive') && (
                      <div className="md:col-span-2 p-4 bg-gradient-to-br from-purple-50/70 via-slate-50 to-pink-50/40 rounded-xl border border-purple-200/80 shadow-xs space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                              <Palette className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xs text-slate-900">
                                {selectedType} &mdash; Pigment &amp; Dosage Formulation Parameters
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Color index, carrier polymer compatibility, letdown ratio (LDR %), and heat dispersion stability.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            COLOR MASTERBATCH GATE
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Color / Shade Reference *</label>
                            <MasterDataCombobox
                              value={color}
                              onChange={(val) => setColor(val)}
                              options={colorList}
                              placeholder="Select Color / Shade..."
                              entityLabel="Color"
                              onSaveCustomOption={(newVal) => {
                                const updated = masterDataGovernanceService.saveColor(newVal);
                                setColorList(updated);
                                showToast(`✓ Color "${newVal}" registered!`);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Carrier Polymer Resin</label>
                            <input
                              type="text"
                              value={carrierResin}
                              onChange={(e) => setCarrierResin(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                              placeholder="e.g. Universal PE/PP Carrier"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Masterbatch Dosage % (LDR) *</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={masterbatchDosage}
                                onChange={(e) => setMasterbatchDosage(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                                placeholder="e.g. 2.5"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold">%</span>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Thermal Heat Stability</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={heatStability}
                                onChange={(e) => setHeatStability(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                                placeholder="e.g. 280°C"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">°C</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-purple-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                Letdown Ratio (LDR) Recipe:
                              </span>
                              <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                {masterbatchDosage || '2.5'}% Dosage
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="font-mono text-xs text-slate-700">
                                = {Number(masterbatchDosage || 2.5) * 10} kg per 1,000 kg Virgin Base Polymer
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-600">
                              Shade: <strong className="text-slate-800">{color || 'Natural / Custom'}</strong> &bull; Carrier: <strong className="text-slate-800">{carrierResin}</strong> &bull; Heat Limit: {heatStability}
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono text-[11px] text-slate-500">
                            <div>Dosing Method:</div>
                            <strong className="text-purple-900 text-xs font-bold">Volumetric / Gravimetric Hopper</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Card for Packaging Material */}
                    {selectedType === 'Packaging Material' && (
                      <div className="md:col-span-2 p-4 bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/40 rounded-xl border border-amber-200/80 shadow-xs space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xs text-slate-900">
                                Packaging Material &mdash; Container, Shipper &amp; Unit Box Specs
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Box outer dimensions, units capacity per shipper, bursting strength, and pallet pack stacking limits.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            PACKAGING SPEC GATE
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Packaging Standard Type *</label>
                            <MasterDataCombobox
                              value={packagingStandard}
                              onChange={(val) => setPackagingStandard(val)}
                              options={packingStandardList}
                              placeholder="Select Packing Standard..."
                              entityLabel="Packaging Standard"
                              onSaveCustomOption={(newVal) => {
                                const updated = masterDataGovernanceService.savePackingStandard(newVal);
                                setPackingStandardList(updated);
                                showToast(`✓ Packaging Standard "${newVal}" registered!`);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Outer Dimensions (L × W × H mm)</label>
                            <input
                              type="text"
                              value={boxDimensions}
                              onChange={(e) => setBoxDimensions(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                              placeholder="e.g. 600 x 400 x 350 mm"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Units per Shipper / Box</label>
                            <input
                              type="number"
                              value={unitsPerPack}
                              onChange={(e) => setUnitsPerPack(Number(e.target.value) || 0)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                              placeholder="e.g. 250"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">HSN / Tariff Code</label>
                            <input
                              type="text"
                              value={hsnCode}
                              onChange={(e) => setHsnCode(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                              placeholder="e.g. 48191010"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                Container Matrix:
                              </span>
                              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {boxDimensions || '600 x 400 x 350 mm'}
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="text-slate-700 font-semibold text-[11px]">
                                Capacity: <strong className="font-mono text-amber-900">{unitsPerPack} pcs / pack</strong>
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-600">
                              Standard: <strong className="text-slate-800">{packagingStandard || 'Corrugated 5-Ply'}</strong> &bull; HSN: {hsnCode || '48191010'}
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono text-[11px] text-slate-500">
                            <div>Stacking Pallet Pattern:</div>
                            <strong className="text-amber-900 text-xs font-bold">4 Layers &bull; 24 Boxes / Pallet</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Card for Spare Part / Consumable */}
                    {(selectedType === 'Spare Part' || selectedType === 'Consumable') && (
                      <div className="md:col-span-2 p-4 bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/40 rounded-xl border border-slate-300/80 shadow-xs space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                              <Wrench className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xs text-slate-900">
                                {selectedType} &mdash; Plant Maintenance &amp; Tooling Asset Specs
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Machine compatibility, spare criticality rating, procurement lead time, and min maintenance buffer.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                            PLANT ASSET GATE
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Equipment / Machine Fitment *</label>
                            <input
                              type="text"
                              value={machineFitment}
                              onChange={(e) => setMachineFitment(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                              placeholder="e.g. Ferromatik 250T / All Molds"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Spare Classification</label>
                            <select
                              value={spareClass}
                              onChange={(e) => setSpareClass(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                            >
                              <option value="Critical Tooling Spare">Critical Tooling Spare (Zero Stockout)</option>
                              <option value="Hydraulic & Pneumatic">Hydraulic &amp; Pneumatic Component</option>
                              <option value="Heater Band & Thermocouple">Heater Band &amp; Thermocouple</option>
                              <option value="Mold Core & Ejector Pin">Mold Core &amp; Ejector Pin</option>
                              <option value="General Plant Consumable">General Plant Consumable</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Procurement Lead Time (Days)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={leadTimeDays}
                                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 0)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                                placeholder="e.g. 7"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">days</span>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Critical Safety Buffer (PCS)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={safetyStock}
                                onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                                placeholder="e.g. 2"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">pcs</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                                Maintenance Fitment:
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {machineFitment}
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="text-slate-700 font-semibold text-[11px]">
                                Class: <strong className="text-slate-900">{spareClass}</strong>
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-600">
                              Lead Time: <strong className="text-slate-800">{leadTimeDays} days</strong> &bull; Min Buffer: <strong className="text-slate-800">{safetyStock} PCS</strong>
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono text-[11px] text-slate-500">
                            <div>Asset Criticality:</div>
                            <strong className="text-rose-700 text-xs font-bold">High Priority Spare</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Live Image Upload Box (Task 2: Real live upload, drag & drop, preview, size) */}
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Item image</label>
                      {itemImage ? (
                        <div className="border border-emerald-300 bg-emerald-50/20 rounded-xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={itemImage}
                              alt="Item Preview"
                              className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-xs bg-white"
                            />
                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {itemImageName || 'Item Photo Attached'}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {itemImageSize || 'Live Photo'} &bull; PNG/JPG preview loaded
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                              Change Photo
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/jpg"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const sizeKb = file.size > 1024 * 1024 
                                      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                      : `${Math.round(file.size / 1024)} KB`;
                                    setItemImageName(file.name);
                                    setItemImageSize(sizeKb);
                                    setItemImage(URL.createObjectURL(file));
                                    showToast(`✓ Photo "${file.name}" (${sizeKb}) loaded live!`);
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setItemImage(null);
                                setItemImageName('');
                                setItemImageSize('');
                                showToast('Photo removed.');
                              }}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                              title="Remove photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsImageDragging(true);
                          }}
                          onDragLeave={() => setIsImageDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsImageDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0];
                              const sizeKb = file.size > 1024 * 1024 
                                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                : `${Math.round(file.size / 1024)} KB`;
                              setItemImageName(file.name);
                              setItemImageSize(sizeKb);
                              setItemImage(URL.createObjectURL(file));
                              showToast(`✓ Photo "${file.name}" (${sizeKb}) loaded live!`);
                            }
                          }}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-2 ${
                            isImageDragging ? 'border-[#0066CC] bg-blue-50/50' : 'border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <UploadCloud className={`w-8 h-8 ${isImageDragging ? 'text-[#0066CC]' : 'text-slate-400'}`} />
                          <div className="font-semibold text-slate-800 text-xs">Drop item photo</div>
                          <p className="text-[11px] text-slate-400">PNG or JPG, 1:1 preferred</p>
                          <label className="mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                            Browse files
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/jpg"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const sizeKb = file.size > 1024 * 1024 
                                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                    : `${Math.round(file.size / 1024)} KB`;
                                  setItemImageName(file.name);
                                  setItemImageSize(sizeKb);
                                  setItemImage(URL.createObjectURL(file));
                                  showToast(`✓ Photo "${file.name}" (${sizeKb}) loaded live!`);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 3: UNITS & CONVERSIONS                               */}
              {/* ========================================================= */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Units &amp; conversions</h2>

                  {/* 5 UOM Selectors */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Base UOM</label>
                      <MasterDataCombobox
                        value={baseUOM}
                        onChange={(val) => setBaseUOM(val)}
                        options={uomList}
                        placeholder="Select UOM..."
                        entityLabel="Unit of Measure"
                        onSaveCustomOption={(newVal) => {
                          const updated = masterDataGovernanceService.saveUom(newVal);
                          setUomList(updated);
                          showToast(`✓ UOM "${newVal}" registered in Admin Master Catalog!`);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Purchase UOM</label>
                      <select
                        value={purchaseUOM}
                        onChange={(e) => setPurchaseUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="Bag">Bag (25 KG)</option>
                        <option value="MT">MT</option>
                        <option value="Pallet">Pallet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sales UOM</label>
                      <select
                        value={salesUOM}
                        onChange={(e) => setSalesUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="PCS">PCS</option>
                        <option value="BOX">BOX</option>
                        <option value="Pallet">Pallet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Stock UOM</label>
                      <select
                        value={stockUOM}
                        onChange={(e) => setStockUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="Bag">Bag</option>
                        <option value="Silo">Silo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Production UOM</label>
                      <select
                        value={productionUOM}
                        onChange={(e) => setProductionUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="GMS">GMS</option>
                        <option value="PCS">PCS</option>
                        <option value="Shot">Shot</option>
                      </select>
                    </div>
                  </div>

                  {/* Conversions Table */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                          <th className="py-2">From</th>
                          <th className="py-2">To</th>
                          <th className="py-2 text-right">Factor</th>
                          <th className="py-2 text-right w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {conversions.map((conv) => (
                          <tr key={conv.id}>
                            <td className="py-2.5">{conv.from}</td>
                            <td className="py-2.5 font-sans font-medium">{conv.to}</td>
                            <td className="py-2.5 text-right font-bold">
                              {conv.factor.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveConversion(conv.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <button
                      type="button"
                      onClick={handleAddConversion}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                    >
                      Add conversion
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 4: MANUFACTURING ATTRIBUTES                          */}
              {/* ========================================================= */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Manufacturing attributes</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Polymer resin, color specifications, and physical properties synced with Master Catalog.
                      </p>
                    </div>
                    {syncedMasterRecord && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Autofilled from Master Data ({syncedMasterRecord.code})
                      </span>
                    )}
                  </div>

                  {syncedMasterRecord && (
                    <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/80 flex items-start gap-2.5 text-xs text-teal-900">
                      <Sparkles className="w-4 h-4 text-[#0F8B8D] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Admin Master Data Synchronized:</span> Resin Type (<strong className="font-mono">{resinType || 'N/A'}</strong>) and Color (<strong className="font-mono">{color || 'N/A'}</strong>) have been automatically populated from the master catalog record <strong className="font-mono">{syncedMasterRecord.code}</strong>. You may fine-tune any properties below.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Resin Type (Task 1: Autocomplete & Dropdown with Admin + Add) */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Resin Type *</span>
                        {syncedMasterRecord?.resinType && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-100">✓ Master Synced</span>
                        )}
                      </label>
                      <MasterDataCombobox
                        value={resinType}
                        onChange={(val) => setResinType(val)}
                        options={resinTypeList}
                        placeholder="Select or type Resin..."
                        entityLabel="Resin Type"
                        onSaveCustomOption={(newVal) => {
                          const updated = masterDataGovernanceService.saveResinType(newVal);
                          setResinTypeList(updated);
                          showToast(`✓ Resin "${newVal}" registered in Admin Master Catalog!`);
                        }}
                      />
                    </div>

                    {/* Color / Finish (Task 1: Autocomplete & Dropdown with Admin + Add) */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Color / Finish *</span>
                        {syncedMasterRecord?.color && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-100">✓ Master Synced</span>
                        )}
                      </label>
                      <MasterDataCombobox
                        value={color}
                        onChange={(val) => setColor(val)}
                        options={colorList}
                        placeholder="Select or type Color..."
                        entityLabel="Color"
                        onSaveCustomOption={(newVal) => {
                          const updated = masterDataGovernanceService.saveColor(newVal);
                          setColorList(updated);
                          showToast(`✓ Color "${newVal}" registered in Admin Master Catalog!`);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Polymer grade</span>
                        {syncedMasterRecord?.polymerGrade && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-100">✓ Master Synced</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={polymerGrade}
                        onChange={(e) => setPolymerGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        placeholder="Repol H110MA"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        Melt flow index (g/10min)
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                      </label>
                      <input
                        type="text"
                        value={mfi}
                        onChange={(e) => setMfi(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="11.0"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Density (g/cm³)</label>
                      <input
                        type="text"
                        value={density}
                        onChange={(e) => setDensity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="0.905"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Additive percentage</label>
                      <input
                        type="text"
                        value={additivePercentage}
                        onChange={(e) => setAdditivePercentage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="1.2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Masterbatch dosage %</label>
                      <input
                        type="text"
                        value={masterbatchDosage}
                        onChange={(e) => setMasterbatchDosage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="3.5"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Regrind allowance %</label>
                      <input
                        type="text"
                        value={regrindAllowance}
                        onChange={(e) => setRegrindAllowance(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="20"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                        <span className="font-semibold text-slate-700">Moisture sensitive (pre-dry)</span>
                        <input
                          type="checkbox"
                          checked={moistureSensitive}
                          onChange={(e) => setMoistureSensitive(e.target.checked)}
                          className="rounded text-[#0066CC] w-4 h-4 focus:ring-[#0066CC]"
                        />
                      </label>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Processing method</label>
                      <select
                        value={processingMethod}
                        onChange={(e) => setProcessingMethod(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Injection Molding">Injection Molding</option>
                        <option value="Extrusion Blow Molding">Extrusion Blow Molding</option>
                        <option value="Sheet Extrusion">Sheet Extrusion</option>
                        <option value="Thermoforming">Thermoforming</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 5: INVENTORY SETTINGS                                */}
              {/* ========================================================= */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Inventory settings</h2>

                  {/* Top Row Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">Lot / batch controlled</span>
                      <input
                        type="checkbox"
                        checked={lotControlled}
                        onChange={(e) => setLotControlled(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC] focus:ring-[#0066CC]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">Expiry controlled</span>
                      <input
                        type="checkbox"
                        checked={expiryControlled}
                        onChange={(e) => setExpiryControlled(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC] focus:ring-[#0066CC]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">FEFO picking (else FIFO)</span>
                      <input
                        type="checkbox"
                        checked={fefoPicking}
                        onChange={(e) => setFefoPicking(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC] focus:ring-[#0066CC]"
                      />
                    </label>
                  </div>

                  {/* Shelf life, Warehouse, Bin, Reorder */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Shelf life (days)</label>
                      <input
                        type="number"
                        value={shelfLifeDays}
                        onChange={(e) => setShelfLifeDays(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="365"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">Default warehouse</label>
                        <button
                          type="button"
                          onClick={handleOpenNewWarehouseModal}
                          className="text-[11px] text-[#0F8B8D] hover:text-[#0c7274] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          + New Warehouse
                        </button>
                      </div>
                      <select
                        value={defaultWarehouse}
                        onChange={(e) => {
                          if (e.target.value === '__CREATE_NEW__') {
                            handleOpenNewWarehouseModal();
                          } else {
                            setDefaultWarehouse(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D]"
                      >
                        {warehouseList.map((wh) => (
                          <option key={wh.code} value={wh.code}>
                            {wh.code} ({wh.name})
                          </option>
                        ))}
                        <option value="__CREATE_NEW__" className="text-[#0F8B8D] font-bold">
                          + Create New Warehouse in Master Data...
                        </option>
                      </select>
                    </div>

                    <div className="relative" ref={binDropdownRef}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">Default bin</label>
                        <button
                          type="button"
                          onClick={() => handleSaveNewBin(defaultBin)}
                          className="text-[11px] text-[#0F8B8D] hover:text-[#0c7274] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          + Register Bin
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={defaultBin}
                          onChange={(e) => {
                            setDefaultBin(e.target.value.toUpperCase());
                            setShowBinDropdown(true);
                          }}
                          onFocus={() => setShowBinDropdown(true)}
                          className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D]"
                          placeholder="e.g. A-01-03 or type to search bins..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowBinDropdown(!showBinDropdown)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Lookup Storage Bins"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {showBinDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-56 flex flex-col animate-in fade-in zoom-in-95">
                          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase">
                            <span className="flex items-center gap-1 text-slate-700">
                              <MapPin className="w-3 h-3 text-[#0F8B8D]" />
                              Master Storage Bins
                            </span>
                            <span className="text-slate-400">({binList.length})</span>
                          </div>
                          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-36">
                            {binList
                              .filter(
                                (b) =>
                                  !defaultBin ||
                                  b.code.toLowerCase().includes(defaultBin.toLowerCase()) ||
                                  b.warehouseCode.toLowerCase().includes(defaultBin.toLowerCase())
                              )
                              .map((b) => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => {
                                    setDefaultBin(b.code);
                                    if (b.warehouseCode) setDefaultWarehouse(b.warehouseCode);
                                    setShowBinDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-teal-50/50 flex items-center justify-between group cursor-pointer transition-colors"
                                >
                                  <div>
                                    <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-[#0F8B8D]">
                                      {b.code}
                                    </span>
                                    <span className="text-[10px] text-slate-500 ml-2">
                                      WH: {b.warehouseCode} ({b.zone})
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-[#0F8B8D] opacity-0 group-hover:opacity-100 font-medium">
                                    Select &rarr;
                                  </span>
                                </button>
                              ))}
                          </div>
                          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleSaveNewBin(defaultBin)}
                              className="text-[11px] text-[#0F8B8D] hover:text-[#0c7274] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              {defaultBin ? `Register "${defaultBin}" to Master Data` : 'Register New Bin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowBinDropdown(false)}
                              className="text-[11px] text-slate-400 hover:text-slate-600"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Reorder level</label>
                      <input
                        type="number"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="10000"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Safety stock</label>
                      <input
                        type="number"
                        value={safetyStock}
                        onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="6000"
                      />
                    </div>
                  </div>

                  {/* Post-Production Routing & Store Destination (WIP, DOL, ASSEMBLY, DEFLASH) - ONLY VISIBLE FOR FINISHED GOODS */}
                  {selectedType === 'Finished Good' && (
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>Post-Molding Routing Destination Checkboxes</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 uppercase tracking-wide">
                              Daily Production Direct Routing
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Select the destination store for this Finished Good. When daily production entry is saved, output is automatically routed to this store.
                          </p>
                        </div>
                        <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                          <span className="text-slate-500">Destination:</span>
                          <span className={`font-bold ${
                            routingDestination === 'WIP' ? 'text-blue-700' :
                            routingDestination === 'DOL' ? 'text-emerald-700' :
                            routingDestination === 'ASSEMBLY' ? 'text-purple-700' : 'text-amber-700'
                          }`}>
                            {routingDestination === 'WIP' ? 'WIP-STORE (Work In Progress Floor)' :
                             routingDestination === 'DOL' ? 'FG-STORE (Direct to FG)' :
                             routingDestination === 'ASSEMBLY' ? 'ASSEMBLY-STORE (Assembly Store)' :
                             'DEFLASH-STORE (Deflash Store)'}
                          </span>
                        </div>
                      </div>

                      {/* 4 Checkbox Cards: WIP (Default), DOL, ASSEMBLY, DEFLASH */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* 1. WIP Checkbox (Default) */}
                        <label className={`relative flex flex-col justify-between p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          isWip
                            ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isWip}
                                  onChange={(e) => handleToggleWip(e.target.checked)}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                />
                                <span className="font-bold text-slate-900 text-sm">WIP</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isWip ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                &rarr; WIP-STORE
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-blue-800">
                              Work In Progress (Default)
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                              When <strong>WIP</strong> is checked (Default), daily production entry automatically routes molded output to <strong>WIP-STORE</strong> intermediate staging floor.
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px]">
                            <span className="text-blue-700 font-medium">Status: {isWip ? 'Active Target (Default)' : 'Inactive'}</span>
                            <span className="font-mono text-blue-900 font-bold">Store: WIP-STORE</span>
                          </div>
                        </label>

                        {/* 2. DOL Checkbox */}
                        <label className={`relative flex flex-col justify-between p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          isDol
                            ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isDol}
                                  onChange={(e) => handleToggleDol(e.target.checked)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                />
                                <span className="font-bold text-slate-900 text-sm">DOL</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isDol ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                &rarr; FG-STORE
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-800">
                              Direct On Line &rarr; FG-store
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                              When <strong>DOL</strong> is checked, daily production entry directly deposits finished output into <strong>FG-STORE</strong> (Finished Goods), bypassing secondary finishing.
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px]">
                            <span className="text-emerald-700 font-medium">Status: {isDol ? 'Active Target Store' : 'Inactive'}</span>
                            <span className="font-mono text-emerald-900 font-bold">Store: FG-STORE</span>
                          </div>
                        </label>

                        {/* 3. ASSEMBLY Checkbox */}
                        <label className={`relative flex flex-col justify-between p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          isAssembly
                            ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isAssembly}
                                  onChange={(e) => handleToggleAssembly(e.target.checked)}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                />
                                <span className="font-bold text-slate-900 text-sm">ASSEMBLY</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isAssembly ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                &rarr; ASSEMBLY-STORE
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-purple-800">
                              Assembly &rarr; Assembly Store
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                              When <strong>ASSEMBLY</strong> is checked, daily production entry routes output to <strong>ASSEMBLY-STORE</strong> for secondary inserts, fittings, or multi-component assembly.
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex items-center justify-between text-[10px]">
                            <span className="text-purple-700 font-medium">Status: {isAssembly ? 'Active Target Store' : 'Inactive'}</span>
                            <span className="font-mono text-purple-900 font-bold">Store: ASSEMBLY-STORE</span>
                          </div>
                        </label>

                        {/* 4. DEFLASH Checkbox */}
                        <label className={`relative flex flex-col justify-between p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          isDeflash
                            ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isDeflash}
                                  onChange={(e) => handleToggleDeflash(e.target.checked)}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                                />
                                <span className="font-bold text-slate-900 text-sm">DEFLASH</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isDeflash ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                &rarr; DEFLASH-STORE
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-amber-800">
                              Deflash &rarr; Deflash Store
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                              When <strong>DEFLASH</strong> is checked, daily production entry routes output to <strong>DEFLASH-STORE</strong> for runner gate cutting, burr deburring, or flame polishing.
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10px]">
                            <span className="text-amber-700 font-medium">Status: {isDeflash ? 'Active Target Store' : 'Inactive'}</span>
                            <span className="font-mono text-amber-900 font-bold">Store: DEFLASH-STORE</span>
                          </div>
                        </label>
                      </div>

                      {/* Routing Visual Process Path */}
                      <div className={`p-3 rounded-xl border text-xs flex items-center justify-between flex-wrap gap-2 ${
                        routingDestination === 'WIP' ? 'bg-blue-50/90 border-blue-300 text-blue-950' :
                        routingDestination === 'DOL' ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' :
                        routingDestination === 'ASSEMBLY' ? 'bg-purple-50/90 border-purple-300 text-purple-950' :
                        'bg-amber-50/90 border-amber-300 text-amber-950'
                      }`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-white border shadow-2xs">
                            Direct Flow
                          </span>
                          <span className="font-medium text-slate-700">Molding Production</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="font-medium text-slate-700">Daily Production Entry</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="px-2 py-0.5 rounded-md font-bold bg-white shadow-xs border text-slate-900">
                            {routingDestination === 'WIP' && 'Received in WIP-STORE (Work In Progress Intermediate Storage)'}
                            {routingDestination === 'DOL' && 'Directly Received in FG-STORE (Finished Goods Direct)'}
                            {routingDestination === 'ASSEMBLY' && 'Received in ASSEMBLY-STORE (Assembly Inventory Store)'}
                            {routingDestination === 'DEFLASH' && 'Received in DEFLASH-STORE (Deflash Inventory Store)'}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold">
                          {routingDestination === 'WIP' && '✓ Staged in WIP store ready for QA sampling or secondary routing'}
                          {routingDestination === 'DOL' && '✓ Bypasses WIP staging directly to customer dispatch ready'}
                          {routingDestination === 'ASSEMBLY' && '⚡ Queued for assembly hardware & packaging lines'}
                          {routingDestination === 'DEFLASH' && '⚡ Queued for secondary deflashing & gate trimming'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 6: QUALITY SETTINGS                                  */}
              {/* ========================================================= */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Quality settings &amp; Inspection</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">Inward QC Inspection Mandatory</span>
                      <input
                        type="checkbox"
                        checked={iqcMandatory}
                        onChange={(e) => setIqcMandatory(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">COA Required from Supplier</span>
                      <input
                        type="checkbox"
                        checked={coaRequired}
                        onChange={(e) => setCoaRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sampling Plan (AQL)</label>
                      <select
                        value={samplingPlan}
                        onChange={(e) => setSamplingPlan(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ISO 2859-1 Level II Normal">ISO 2859-1 Level II Normal (General AQL 1.0)</option>
                        <option value="100% Critical Inspection">100% Critical Inspection (Automotive Zero Defect)</option>
                        <option value="Skip-Lot Certified Vendor">Skip-Lot Certified Vendor Audit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Approved Quality Testing Lab</label>
                      <MasterDataCombobox
                        value={approvedLab}
                        onChange={(val) => setApprovedLab(val)}
                        options={testingLabList}
                        placeholder="Select or type Testing Lab..."
                        entityLabel="Testing Lab"
                        onSaveCustomOption={(newVal) => {
                          const updated = masterDataGovernanceService.saveTestingLab(newVal);
                          setTestingLabList(updated);
                          showToast(`✓ Testing Lab "${newVal}" registered in Admin Master Catalog!`);
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 text-xs space-y-2">
                    <label className="block font-semibold text-slate-700">Mandatory Lot Test Checklist</label>
                    <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50">
                      {[
                        'Melt Flow Index (ASTM D1238)',
                        'Density Gradient (ASTM D792)',
                        'Moisture Content PPM (Karl Fischer)',
                        'Color Delta E Spectrophotometer Scan',
                        'Ash / Filler Content % (Thermogravimetric)',
                      ].map((t) => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={qualityTestParams.includes(t)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQualityTestParams([...qualityTestParams, t]);
                              } else {
                                setQualityTestParams(qualityTestParams.filter((x) => x !== t));
                              }
                            }}
                            className="rounded text-[#0066CC]"
                          />
                          <span className="text-slate-800">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 7: PURCHASING                                        */}
              {/* ========================================================= */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Purchasing &amp; Sourcing Attributes</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* Primary Preferred Supplier Autocomplete Combobox */}
                    <div className="relative" ref={supplierDropdownRef}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">Primary Preferred Supplier</label>
                        <button
                          type="button"
                          onClick={() => handleOpenNewSupplierModal(preferredSupplier)}
                          className="text-[11px] text-[#0F8B8D] hover:text-[#0c7274] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          + New Supplier
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={preferredSupplier}
                          onChange={(e) => {
                            setPreferredSupplier(e.target.value);
                            setShowSupplierDropdown(true);
                          }}
                          onFocus={() => setShowSupplierDropdown(true)}
                          className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D]"
                          placeholder="e.g. Reliance Industries or type to search..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Lookup Suppliers"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {showSupplierDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-64 flex flex-col animate-in fade-in zoom-in-95">
                          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase">
                            <span className="flex items-center gap-1 text-slate-700">
                              <Truck className="w-3 h-3 text-[#0F8B8D]" />
                              Master Registered Suppliers
                            </span>
                            <span className="text-slate-400">({supplierList.length})</span>
                          </div>
                          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-48">
                            {supplierList
                              .filter(
                                (s) =>
                                  !preferredSupplier ||
                                  s.name.toLowerCase().includes(preferredSupplier.toLowerCase()) ||
                                  s.code.toLowerCase().includes(preferredSupplier.toLowerCase()) ||
                                  (s.category && s.category.toLowerCase().includes(preferredSupplier.toLowerCase()))
                              )
                              .map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleSelectSupplier(s)}
                                  className="w-full text-left px-3 py-2.5 hover:bg-teal-50/50 flex items-start justify-between group cursor-pointer transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#0F8B8D]">
                                        {s.name}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                        {s.code}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                      <span>Cat: <strong className="text-slate-700">{s.category}</strong></span>
                                      <span>&bull;</span>
                                      <span>HSN: <strong className="font-mono text-slate-800">{s.hsnCode || '39021000'}</strong></span>
                                      <span>&bull;</span>
                                      <span>MOQ: <strong className="font-mono text-slate-800">{s.moq?.toLocaleString() || '1,000'}</strong></span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-semibold text-[#0F8B8D] opacity-0 group-hover:opacity-100 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                    Auto-fill &rarr;
                                  </span>
                                </button>
                              ))}
                          </div>
                          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleOpenNewSupplierModal(preferredSupplier)}
                              className="text-[11px] text-[#0F8B8D] hover:text-[#0c7274] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              + Register New Supplier in Master Data
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSupplierDropdown(false)}
                              className="text-[11px] text-slate-400 hover:text-slate-600"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Standard Purchase Cost (₹ / UOM)</label>
                      <input
                        type="number"
                        step={0.5}
                        value={standardPurchasePrice}
                        onChange={(e) => setStandardPurchasePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="112.50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">HSN / Tariff Code</label>
                      <input
                        type="text"
                        value={hsnCode}
                        onChange={(e) => setHsnCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="39021000"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Supplier Lead Time (Days)</label>
                      <input
                        type="number"
                        value={leadTimeDays}
                        onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="7"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Minimum Order Qty (MOQ)</label>
                      <input
                        type="number"
                        value={purchaseMoq}
                        onChange={(e) => setPurchaseMoq(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="5000"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">GST Tax Rate</label>
                      <select
                        value={gstRate}
                        onChange={(e) => setGstRate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                      >
                        <option value="18%">18% (Standard Resins &amp; Chemicals)</option>
                        <option value="12%">12% (Specified Polymer Articles)</option>
                        <option value="5%">5% (Recycled Polyolefins)</option>
                        <option value="0%">0% (Exempt Export Supply)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 8: SALES                                             */}
              {/* ========================================================= */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Commercial &amp; Sales Pricing</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Standard List Price (₹ / UOM)</label>
                      <input
                        type="number"
                        step={1}
                        value={standardSalesPrice}
                        onChange={(e) => setStandardSalesPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="145.00"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pricing Tier / Matrix</label>
                      <select
                        value={priceTier}
                        onChange={(e) => setPriceTier(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                      >
                        <option value="Tier 1 OEM Standard">Tier 1 OEM Standard (Cost Plus 22%)</option>
                        <option value="Tier 2 Volume Discount">Tier 2 Volume Discount (&gt; 10 MT)</option>
                        <option value="Distributor Bracket">Distributor Bracket (FOB Factory)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Min Sales Order Qty (MOQ)</label>
                      <input
                        type="number"
                        value={salesMoq}
                        onChange={(e) => setSalesMoq(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="1000"
                      />
                    </div>

                    {/* Finished Goods Packaging Standard (Task 1: Autocomplete & Dropdown with Admin + Add) */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Finished Goods Packaging Standard</label>
                      <MasterDataCombobox
                        value={packagingStandard}
                        onChange={(val) => setPackagingStandard(val)}
                        options={packingStandardList}
                        placeholder="Select or type Packaging Standard..."
                        entityLabel="Packaging Standard"
                        onSaveCustomOption={(newVal) => {
                          const updated = masterDataGovernanceService.savePackingStandard(newVal);
                          setPackingStandardList(updated);
                          showToast(`✓ Packaging Standard "${newVal}" registered in Admin Master Catalog!`);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 9: DOCUMENTS (Task 2: Live real file uploads)         */}
              {/* ========================================================= */}
              {currentStep === 9 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Technical Documentation &amp; Compliance</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Live repository for genuine TDS, MSDS, 2D Part Drawings, and RoHS / REACH certifications.
                      </p>
                    </div>
                    <label className="px-3 py-1.5 text-xs font-semibold text-[#0066CC] bg-[#F0F7FF] border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0066CC]" />
                      + Attach RoHS Compliance
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const sizeKb = file.size > 1024 * 1024
                              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                              : `${Math.round(file.size / 1024)} KB`;
                            const fileUrl = URL.createObjectURL(file);
                            setDocuments([
                              ...documents,
                              {
                                name: file.name,
                                type: 'RoHS / REACH Declaration',
                                size: sizeKb,
                                uploadedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                url: fileUrl,
                              },
                            ]);
                            showToast(`✓ RoHS Compliance document "${file.name}" (${sizeKb}) attached live!`);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {documents.length > 0 ? (
                    <div className="space-y-2.5 text-xs">
                      {documents.map((doc, idx) => {
                        const ext = doc.name.split('.').pop()?.toUpperCase() || 'DOC';
                        const badgeColor =
                          ext === 'PDF' ? 'bg-rose-100 text-rose-700' :
                          ext === 'STEP' || ext === 'STP' || ext === 'DWG' ? 'bg-purple-100 text-purple-700' :
                          ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' ? 'bg-teal-100 text-teal-700' :
                          'bg-blue-100 text-blue-700';

                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/90 hover:bg-slate-50 flex items-center justify-between transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2 rounded-lg font-bold text-[10px] shrink-0 ${badgeColor}`}>
                                {ext}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{doc.name}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {doc.type} &bull; <strong className="font-mono text-slate-700">{doc.size}</strong> &bull; {doc.uploadedOn}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={doc.name}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-[#0066CC] hover:bg-blue-50 rounded-lg flex items-center gap-1 border border-blue-200"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View / Download
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setDocuments(documents.filter((_, i) => i !== idx));
                                  showToast(`Removed "${doc.name}"`);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                                title="Delete document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Drag and Drop Zone for Multiple Documents */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDocDragging(true);
                    }}
                    onDragLeave={() => setIsDocDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDocDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const newDocs = Array.from(e.dataTransfer.files).map((f) => {
                          const sizeKb = f.size > 1024 * 1024
                            ? `${(f.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${Math.round(f.size / 1024)} KB`;
                          const ext = f.name.split('.').pop()?.toLowerCase();
                          const type =
                            ext === 'step' || ext === 'stp' || ext === 'dwg' || ext === 'dxf'
                              ? 'CAD / 3D STEP Model'
                              : ext === 'pdf' && f.name.toLowerCase().includes('msds')
                              ? 'MSDS Sheet'
                              : ext === 'pdf' && f.name.toLowerCase().includes('tds')
                              ? 'Technical Data Sheet (TDS)'
                              : 'Technical Specification';

                          return {
                            name: f.name,
                            type,
                            size: sizeKb,
                            uploadedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                            url: URL.createObjectURL(f),
                          };
                        });
                        setDocuments([...documents, ...newDocs]);
                        showToast(`✓ ${newDocs.length} live document(s) uploaded!`);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-2 ${
                      isDocDragging ? 'border-[#0066CC] bg-blue-50/50' : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <UploadCloud className={`w-8 h-8 ${isDocDragging ? 'text-[#0066CC]' : 'text-slate-400'}`} />
                    <div className="font-semibold text-xs text-slate-800">Upload additional technical documents</div>
                    <p className="text-[11px] text-slate-400">TDS, MSDS, 2D Part Drawings, CAD STEP models</p>
                    <label className="mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                      Browse technical files
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.step,.stp,.dwg,.dxf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.zip"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const newDocs = Array.from(e.target.files).map((f) => {
                              const sizeKb = f.size > 1024 * 1024
                                ? `${(f.size / (1024 * 1024)).toFixed(2)} MB`
                                : `${Math.round(f.size / 1024)} KB`;
                              const ext = f.name.split('.').pop()?.toLowerCase();
                              const type =
                                ext === 'step' || ext === 'stp' || ext === 'dwg' || ext === 'dxf'
                                  ? 'CAD / 3D STEP Model'
                                  : ext === 'pdf' && f.name.toLowerCase().includes('msds')
                                  ? 'MSDS Sheet'
                                  : ext === 'pdf' && f.name.toLowerCase().includes('tds')
                                  ? 'Technical Data Sheet (TDS)'
                                  : 'Technical Specification';

                              return {
                                name: f.name,
                                type,
                                size: sizeKb,
                                uploadedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                url: URL.createObjectURL(f),
                              };
                            });
                            setDocuments([...documents, ...newDocs]);
                            showToast(`✓ ${newDocs.length} live document(s) uploaded!`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 10: REVIEW & SUBMIT + WORKFLOW                      */}
              {/* ========================================================= */}
              {currentStep === 10 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Review &amp; Approval Workflow</h2>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F0F7FF] text-[#0066CC]">
                      Ready for Submission
                    </span>
                  </div>

                  {/* Summary Review Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Item Identity</div>
                      <div className="font-mono font-bold text-[#0066CC]">{itemCode}</div>
                      <div className="font-bold text-slate-900">{itemName}</div>
                      <div className="text-slate-500 text-[11px]">{selectedType} &bull; {category}</div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Technical &amp; Manufacturing</div>
                      <div className="text-slate-800">Base UOM: <strong>{baseUOM}</strong></div>
                      {(selectedType === 'Finished Good' || selectedType === 'Semi-Finished Good') ? (
                        <>
                          <div className="text-slate-800 font-mono text-[11px]">
                            Cycle: <strong>{cycleTime || 24.5}s</strong> &bull; Cavities: <strong>{cavityCount || 1}</strong>
                          </div>
                          <div className="text-[#0066CC] font-mono text-[11px] font-semibold">
                            Part: {partWeight}g + Runner: {runnerWeight}g = Shot: {calculatedSingleShotWeight}g
                          </div>
                        </>
                      ) : (selectedType === 'Raw Material' || selectedType === 'Regrind') ? (
                        <>
                          <div className="text-slate-800 font-mono text-[11px]">MFI: <strong>{mfi || '11.0'} g/10min</strong> &bull; Dens: <strong>{density || '0.905'}</strong></div>
                          <div className="text-emerald-700 text-[11px] font-semibold">Resin: {resinType || 'PP'} ({polymerGrade || 'Virgin'}) &bull; Regrind: {regrindAllowance || '20'}%</div>
                        </>
                      ) : (selectedType === 'Masterbatch' || selectedType === 'Colorant' || selectedType === 'Additive') ? (
                        <>
                          <div className="text-slate-800 font-mono text-[11px]">LDR Dosage: <strong>{masterbatchDosage || '2.5'}%</strong> &bull; Heat: <strong>{heatStability || '280°C'}</strong></div>
                          <div className="text-purple-700 text-[11px] font-semibold">Color: {color || 'Custom'} &bull; Carrier: {carrierResin || 'Universal'}</div>
                        </>
                      ) : selectedType === 'Packaging Material' ? (
                        <>
                          <div className="text-slate-800 font-mono text-[11px]">Dim: <strong>{boxDimensions || 'Standard Box'}</strong></div>
                          <div className="text-amber-800 text-[11px] font-semibold">Pack: {unitsPerPack || 250} pcs/box &bull; {packagingStandard || '5-Ply'}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-slate-800 font-mono text-[11px]">Fitment: <strong>{machineFitment || 'All Machines'}</strong></div>
                          <div className="text-slate-700 text-[11px] font-semibold">Class: {spareClass} &bull; Lead: {leadTimeDays}d</div>
                        </>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Inventory &amp; Quality</div>
                      <div className="text-slate-800">Warehouse: <strong>{defaultWarehouse}</strong> ({defaultBin})</div>
                      <div className="text-slate-800">
                        Routing: <strong className={
                          routingDestination === 'WIP' ? 'text-blue-700 font-bold' :
                          routingDestination === 'DOL' ? 'text-emerald-700 font-bold' :
                          routingDestination === 'ASSEMBLY' ? 'text-purple-700 font-bold' : 'text-amber-700 font-bold'
                        }>
                          {routingDestination === 'WIP' ? 'WIP (WIP-STORE - Intermediate)' :
                           routingDestination === 'DOL' ? 'DOL (FG-STORE - Direct)' :
                           routingDestination === 'ASSEMBLY' ? 'ASSEMPLY (ASSEMBLY-STORE)' :
                           'DEFLASH (DEFLASH-STORE)'}
                        </strong>
                      </div>
                      <div className="text-slate-800">Reorder: <strong>{reorderLevel.toLocaleString()} {baseUOM}</strong></div>
                      <div className="text-emerald-700 text-[11px] font-semibold">IQC Mandatory &bull; COA Required</div>
                    </div>
                  </div>

                  {/* Workflow Sign-off Section */}
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <GitPullRequest className="w-4 h-4 text-[#0066CC]" />
                      Master Data Governance &amp; Multi-Tier Sign-Off Route
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Approval Workflow Route</label>
                        <select
                          value={workflowRoute}
                          onChange={(e) => setWorkflowRoute(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Multi-Tier: Engineering Author -> QA Lead -> Plant Operations Manager">
                            Multi-Tier: Engineering Author &rarr; QA Lead &rarr; Plant Head
                          </option>
                          <option value="Direct Release: QA Director Immediate Approval">
                            Direct Release: QA Director Immediate Approval
                          </option>
                          <option value="Standard Procurement: Sourcing Lead -> Finance Controller">
                            Standard Procurement: Sourcing Lead &rarr; Finance Controller
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Submission Priority</label>
                        <select
                          value={workflowPriority}
                          onChange={(e) => setWorkflowPriority(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Normal">Normal (48-hour SLA)</option>
                          <option value="Urgent">Urgent (24-hour SLA - Production Scheduled)</option>
                          <option value="Expedited">Expedited (Same-Day Emergency Lot)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Audit Trail Submission Notes</label>
                      <input
                        type="text"
                        value={creationNotes}
                        onChange={(e) => setCreationNotes(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        placeholder="Describe program, change request, or rationale..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Nav Buttons Bar */}
            <div className="pt-5 border-t border-slate-200 flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Save as draft
                </button>

                {currentStep < 10 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052a3] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitFinal(true)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Save as Active Master
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitFinal(false)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052a3] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Submit for Approval
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REGISTER NEW MASTER DATA RECORD SUB-MODAL (ADMIN GOVERNANCE)              */}
      {/* ========================================================================= */}
      {isMasterDataModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#0F8B8D] font-bold uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5" />
                  <span>Admin Master Data Governance</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">
                  Register Master Record &amp; Auto-fill
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single source of truth catalog. Saves to Master Data and auto-populates item wizard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMasterDataModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMasterModalRecord} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={masterModalForm.entityType}
                    onChange={(e) => setMasterModalForm({ ...masterModalForm, entityType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Polymer Resin Item">Polymer Resin Item</option>
                    <option value="Color Masterbatch">Color Masterbatch</option>
                    <option value="Finished Molded Component">Finished Molded Component</option>
                    <option value="Tooling & Mold Asset">Tooling &amp; Mold Asset</option>
                    <option value="Customer Account">Customer Account</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Master Code *</label>
                  <input
                    type="text"
                    required
                    value={masterModalForm.code || ''}
                    onChange={(e) => setMasterModalForm({ ...masterModalForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. RES-PP-COPO-02"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Item / Account Description *</label>
                  <input
                    type="text"
                    required
                    value={masterModalForm.name || ''}
                    onChange={(e) => setMasterModalForm({ ...masterModalForm, name: e.target.value })}
                    placeholder="e.g. Polypropylene Impact Co-Polymer (MFI 12, High Izod)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Classification / Category *</label>
                  <MasterDataCombobox
                    value={masterModalForm.category || ''}
                    onChange={(val) => setMasterModalForm({ ...masterModalForm, category: val })}
                    options={categoryList}
                    placeholder="Select or enter Category..."
                    entityLabel="Category"
                    onSaveCustomOption={(newVal) => {
                      const updated = masterDataGovernanceService.saveCategory(newVal);
                      setCategoryList(updated);
                      showToast(`✓ Category "${newVal}" saved to Master Catalog!`);
                    }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Group *</label>
                  <MasterDataCombobox
                    value={masterModalForm.itemGroup || ''}
                    onChange={(val) => setMasterModalForm({ ...masterModalForm, itemGroup: val })}
                    options={itemGroupList}
                    placeholder="Select or enter Item Group..."
                    entityLabel="Item Group"
                    onSaveCustomOption={(newVal) => {
                      const updated = masterDataGovernanceService.saveItemGroup(newVal);
                      setItemGroupList(updated);
                      showToast(`✓ Item Group "${newVal}" saved to Master Catalog!`);
                    }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Unit of Measure</label>
                  <MasterDataCombobox
                    value={masterModalForm.primaryUom || 'Kilograms (KG)'}
                    onChange={(val) => setMasterModalForm({ ...masterModalForm, primaryUom: val })}
                    options={uomList}
                    placeholder="Select or enter UOM..."
                    entityLabel="Unit of Measure"
                    onSaveCustomOption={(newVal) => {
                      const updated = masterDataGovernanceService.saveUom(newVal);
                      setUomList(updated);
                      showToast(`✓ UOM "${newVal}" saved to Master Catalog!`);
                    }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Multi-Plant Scope</label>
                  <MasterDataCombobox
                    value={masterModalForm.plantScope || 'All Plants (Global)'}
                    onChange={(val) => setMasterModalForm({ ...masterModalForm, plantScope: val })}
                    options={plantScopeList}
                    placeholder="Select or enter Plant Scope..."
                    entityLabel="Plant Scope"
                    onSaveCustomOption={(newVal) => {
                      const updated = masterDataGovernanceService.savePlantScope(newVal);
                      setPlantScopeList(updated);
                      showToast(`✓ Plant Scope "${newVal}" saved to Master Catalog!`);
                    }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resin Type / Base Material</label>
                  <MasterDataCombobox
                    value={masterModalForm.resinType || ''}
                    onChange={(val) => setMasterModalForm({ ...masterModalForm, resinType: val })}
                    options={resinTypeList}
                    placeholder="Select or enter Resin..."
                    entityLabel="Resin Type"
                    onSaveCustomOption={(newVal) => {
                      const updated = masterDataGovernanceService.saveResinType(newVal);
                      setResinTypeList(updated);
                      showToast(`✓ Resin "${newVal}" saved to Master Catalog!`);
                    }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Color / Finish</label>
                  <MasterDataCombobox
                    value={masterModalForm.color || ''}
                    onChange={(val) => setMasterModalForm({ ...masterModalForm, color: val })}
                    options={colorList}
                    placeholder="Select or enter Color..."
                    entityLabel="Color"
                    onSaveCustomOption={(newVal) => {
                      const updated = masterDataGovernanceService.saveColor(newVal);
                      setColorList(updated);
                      showToast(`✓ Color "${newVal}" saved to Master Catalog!`);
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Compliance &amp; Quality Mandates</label>
                  <MasterDataCombobox
                    value={masterModalForm.complianceCert || ''}
                    onChange={(val) => setMasterModalForm({ ...masterModalForm, complianceCert: val })}
                    options={complianceList}
                    placeholder="Select or enter Compliance Mandates..."
                    entityLabel="Compliance Mandate"
                    onSaveCustomOption={(newVal) => {
                      const updated = masterDataGovernanceService.saveComplianceMandate(newVal);
                      setComplianceList(updated);
                      showToast(`✓ Compliance Mandate "${newVal}" saved to Master Catalog!`);
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Will immediately auto-fill into Item Wizard Step 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMasterDataModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save &amp; Auto-Fill
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 1: Register New Supplier Modal */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-teal-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F8B8D] text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Register New Supplier in Master Data</h3>
                  <p className="text-[11px] text-slate-500">Auto-fills Supplier Name, HSN Code, and MOQ into wizard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSupplier} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Code *</label>
                  <input
                    type="text"
                    required
                    value={newSupplierForm.code}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, code: e.target.value.toUpperCase() })}
                    placeholder="SUP-2025"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newSupplierForm.name}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                    placeholder="e.g. Supreme Petrochem Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newSupplierForm.category}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Virgin Resin">Virgin Resin Feedstock</option>
                    <option value="Masterbatch & Colorants">Masterbatch &amp; Colorants</option>
                    <option value="Additives & Stabilizers">Additives &amp; Stabilizers</option>
                    <option value="Molds & Tooling">Molds &amp; Tooling Spares</option>
                    <option value="Packaging & Corrugated">Packaging &amp; Corrugated</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN / Tariff Code *</label>
                  <input
                    type="text"
                    required
                    value={newSupplierForm.hsnCode}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, hsnCode: e.target.value, tariffCode: e.target.value })}
                    placeholder="39021000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default MOQ (Min Order Qty) *</label>
                  <input
                    type="number"
                    required
                    value={newSupplierForm.moq}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, moq: parseInt(e.target.value) || 0 })}
                    placeholder="5000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={newSupplierForm.leadTimeDays}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, leadTimeDays: parseInt(e.target.value) || 0 })}
                    placeholder="7"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Will auto-fill into Item Wizard Step 7</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewSupplierModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Register &amp; Auto-Fill
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 3: Register New Warehouse Modal */}
      {isNewWarehouseModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-teal-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F8B8D] text-white flex items-center justify-center shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Register Warehouse in Master Data</h3>
                  <p className="text-[11px] text-slate-500">Adds facility to central inventory governance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewWarehouseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewWarehouse} className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse Code *</label>
                  <input
                    type="text"
                    required
                    value={newWarehouseForm.code}
                    onChange={(e) => setNewWarehouseForm({ ...newWarehouseForm, code: e.target.value.toUpperCase() })}
                    placeholder="RM-WH-03"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse Name *</label>
                  <input
                    type="text"
                    required
                    value={newWarehouseForm.name}
                    onChange={(e) => setNewWarehouseForm({ ...newWarehouseForm, name: e.target.value })}
                    placeholder="e.g. South Plant Polymer Storage & Blending"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Zone / Description</label>
                  <input
                    type="text"
                    value={newWarehouseForm.zone}
                    onChange={(e) => setNewWarehouseForm({ ...newWarehouseForm, zone: e.target.value })}
                    placeholder="e.g. Zone A - Heavy Polymer Silos"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Multi-Plant Scope</label>
                  <select
                    value={newWarehouseForm.plantScope}
                    onChange={(e) => setNewWarehouseForm({ ...newWarehouseForm, plantScope: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="All Plants (Global)">All Plants (Global)</option>
                    <option value="Pune & Sanand Units">Pune &amp; Sanand Units</option>
                    <option value="Chennai Molding Only">Chennai Molding Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Will immediately select as default warehouse</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewWarehouseModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save &amp; Select
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
