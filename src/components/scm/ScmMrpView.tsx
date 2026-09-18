import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Play,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Sliders,
  Search,
  ExternalLink,
  Building2,
  Globe,
  ShoppingCart,
  Send,
  Calendar,
  Package,
  TrendingUp,
  Boxes,
  Check,
  X,
  ChevronDown,
  Info,
  Trash2,
  Edit3,
} from 'lucide-react';
import { ItemMaster, BomMaster } from '../../types';
import { PurchaseRequisition, PurchaseRequisitionLine } from '../../types/procurement';
import { addPurchaseRequisition } from '../../data/procurementData';
import { PaginationBar } from '../common/PaginationBar';
import { usePagination } from '../../hooks/usePagination';

// Plant metadata definition
export interface PlantConfig {
  id: string;
  code: string;
  name: string;
  location: string;
  color: string;
}

export const SCM_PLANTS: PlantConfig[] = [
  { id: 'PLANT-01', code: 'P01-HOSUR', name: 'Plant 01 - Hosūr Main Hub', location: 'Hosur, Tamil Nadu', color: '#0F8B8D' },
  { id: 'PLANT-02', code: 'P02-SANAND', name: 'Plant 02 - Sanand Auto-Plast', location: 'Sanand, Gujarat', color: '#E8622C' },
  { id: 'PLANT-03', code: 'P03-CHENNAI', name: 'Plant 03 - Chennai Precision', location: 'Chennai, Tamil Nadu', color: '#6366F1' },
];

// Monthly Sales Order Demand Input structure
export interface MonthlySalesDemandItem {
  id: string;
  itemCode: string;
  itemName: string;
  plantId: string;
  targetClosingQty: number; // Qty needed to close monthly sales (Input from user)
  confirmedSoQty: number;   // Existing confirmed sales orders
  uom: string;
  unitWeightKg: number;    // Net weight in kg
  monthPeriod: string;
  customerSegment: string;
  bomId: string;
}

// Initial monthly sales target commitments
export const INITIAL_MONTHLY_SALES_DEMANDS: MonthlySalesDemandItem[] = [
  {
    id: 'MSD-001',
    itemCode: 'FG-CTN-500',
    itemName: 'Plastic Container 500ml (Food Grade)',
    plantId: 'PLANT-01',
    confirmedSoQty: 32000,
    targetClosingQty: 45000, // User can edit this live
    uom: 'PCS',
    unitWeightKg: 0.0425,
    monthPeriod: 'September 2026',
    customerSegment: 'FMCG Food & Dairy',
    bomId: 'BOM-1001',
  },
  {
    id: 'MSD-002',
    itemCode: 'FG-BKT-020',
    itemName: 'Paint Bucket 20L Heavy Duty with Handle',
    plantId: 'PLANT-01',
    confirmedSoQty: 18000,
    targetClosingQty: 25000,
    uom: 'PCS',
    unitWeightKg: 0.850,
    monthPeriod: 'September 2026',
    customerSegment: 'Industrial Coatings',
    bomId: 'BOM-1002',
  },
  {
    id: 'MSD-003',
    itemCode: 'FG-AUTO-012',
    itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
    plantId: 'PLANT-02',
    confirmedSoQty: 22000,
    targetClosingQty: 30000,
    uom: 'PCS',
    unitWeightKg: 0.185,
    monthPeriod: 'September 2026',
    customerSegment: 'Automotive Tier-1 OEM',
    bomId: 'BOM-1004',
  },
  {
    id: 'MSD-004',
    itemCode: 'FG-AUTO-045',
    itemName: 'PP Air Duct Housing - Front Left',
    plantId: 'PLANT-02',
    confirmedSoQty: 15000,
    targetClosingQty: 20000,
    uom: 'PCS',
    unitWeightKg: 0.320,
    monthPeriod: 'September 2026',
    customerSegment: 'Automotive Tier-1 OEM',
    bomId: 'BOM-1005',
  },
  {
    id: 'MSD-005',
    itemCode: 'FG-FLIP-28',
    itemName: '28mm PP Flip-Top Dispenser Cap',
    plantId: 'PLANT-03',
    confirmedSoQty: 85000,
    targetClosingQty: 120000,
    uom: 'PCS',
    unitWeightKg: 0.0048,
    monthPeriod: 'September 2026',
    customerSegment: 'Consumer Personal Care',
    bomId: 'BOM-1003',
  },
  {
    id: 'MSD-006',
    itemCode: 'FG-MED-VIAL-10',
    itemName: '10ml Sterile Diagnostic Sample Vial',
    plantId: 'PLANT-03',
    confirmedSoQty: 60000,
    targetClosingQty: 90000,
    uom: 'PCS',
    unitWeightKg: 0.0125,
    monthPeriod: 'September 2026',
    customerSegment: 'Medical & Diagnostics',
    bomId: 'BOM-1006',
  },
];

// Exploded Raw Material Inventory & Procurement parameter
export interface MaterialMasterPlanningRecord {
  code: string;
  name: string;
  category: 'Virgin Polymer Resin' | 'Color Masterbatch' | 'Additives & Fillers' | 'Packaging Materials' | 'Components';
  uom: string;
  unitCost: number;
  moq: number;
  leadTimeDays: number;
  preferredSupplierId: string;
  preferredSupplierName: string;
  // Plant-wise inventory stocks [PLANT-01, PLANT-02, PLANT-03]
  plantStock: {
    [plantId: string]: {
      onHand: number;
      inTransit: number;
      safetyStock: number;
    };
  };
}

export const RAW_MATERIALS_STOCK_DATA: MaterialMasterPlanningRecord[] = [
  {
    code: 'RM-PP-NAT-001',
    name: 'PP Natural Granules H110MA (Prime Virgin)',
    category: 'Virgin Polymer Resin',
    uom: 'KG',
    unitCost: 78.50,
    moq: 5000,
    leadTimeDays: 7,
    preferredSupplierId: 'SUP-001',
    preferredSupplierName: 'Reliance Polymers Ltd',
    plantStock: {
      'PLANT-01': { onHand: 1250, inTransit: 2000, safetyStock: 1500 },
      'PLANT-02': { onHand: 800, inTransit: 0, safetyStock: 1000 },
      'PLANT-03': { onHand: 420, inTransit: 1000, safetyStock: 600 },
    },
  },
  {
    code: 'RM-HDPE-001',
    name: 'HDPE Blow/Injection Resin B56003',
    category: 'Virgin Polymer Resin',
    uom: 'KG',
    unitCost: 84.00,
    moq: 10000,
    leadTimeDays: 10,
    preferredSupplierId: 'SUP-002',
    preferredSupplierName: 'IOCL Petrochemicals Ltd',
    plantStock: {
      'PLANT-01': { onHand: 8500, inTransit: 5000, safetyStock: 6000 },
      'PLANT-02': { onHand: 1200, inTransit: 0, safetyStock: 1500 },
      'PLANT-03': { onHand: 350, inTransit: 0, safetyStock: 500 },
    },
  },
  {
    code: 'RM-ABS-BLK-001',
    name: 'High-Impact ABS Resin (Lustran 348 Black)',
    category: 'Virgin Polymer Resin',
    uom: 'KG',
    unitCost: 142.00,
    moq: 3000,
    leadTimeDays: 14,
    preferredSupplierId: 'SUP-004',
    preferredSupplierName: 'INEOS Styrolution India',
    plantStock: {
      'PLANT-01': { onHand: 500, inTransit: 0, safetyStock: 800 },
      'PLANT-02': { onHand: 1850, inTransit: 1500, safetyStock: 2500 },
      'PLANT-03': { onHand: 0, inTransit: 0, safetyStock: 0 },
    },
  },
  {
    code: 'RM-PP-CP-009',
    name: 'PP Impact Copolymer MI3530',
    category: 'Virgin Polymer Resin',
    uom: 'KG',
    unitCost: 88.50,
    moq: 5000,
    leadTimeDays: 8,
    preferredSupplierId: 'SUP-001',
    preferredSupplierName: 'Reliance Polymers Ltd',
    plantStock: {
      'PLANT-01': { onHand: 1100, inTransit: 0, safetyStock: 1000 },
      'PLANT-02': { onHand: 2400, inTransit: 2000, safetyStock: 3000 },
      'PLANT-03': { onHand: 0, inTransit: 0, safetyStock: 0 },
    },
  },
  {
    code: 'RM-PET-MED-01',
    name: 'Medical Grade PET Resin (Sterile IV Grade)',
    category: 'Virgin Polymer Resin',
    uom: 'KG',
    unitCost: 115.00,
    moq: 2000,
    leadTimeDays: 12,
    preferredSupplierId: 'SUP-006',
    preferredSupplierName: 'Eastman Chemical Asia',
    plantStock: {
      'PLANT-01': { onHand: 0, inTransit: 0, safetyStock: 0 },
      'PLANT-02': { onHand: 0, inTransit: 0, safetyStock: 0 },
      'PLANT-03': { onHand: 650, inTransit: 500, safetyStock: 800 },
    },
  },
  {
    code: 'MB-BLU-001',
    name: 'Royal Blue Masterbatch (2% Food Grade Dosage)',
    category: 'Color Masterbatch',
    uom: 'KG',
    unitCost: 220.00,
    moq: 250,
    leadTimeDays: 5,
    preferredSupplierId: 'SUP-003',
    preferredSupplierName: 'Clariant Masterbatches Ltd',
    plantStock: {
      'PLANT-01': { onHand: 18, inTransit: 25, safetyStock: 30 },
      'PLANT-02': { onHand: 10, inTransit: 0, safetyStock: 15 },
      'PLANT-03': { onHand: 5, inTransit: 0, safetyStock: 10 },
    },
  },
  {
    code: 'MB-WHT-001',
    name: 'Titanium White Masterbatch 70% Loading',
    category: 'Color Masterbatch',
    uom: 'KG',
    unitCost: 195.00,
    moq: 500,
    leadTimeDays: 5,
    preferredSupplierId: 'SUP-003',
    preferredSupplierName: 'Clariant Masterbatches Ltd',
    plantStock: {
      'PLANT-01': { onHand: 120, inTransit: 100, safetyStock: 200 },
      'PLANT-02': { onHand: 40, inTransit: 0, safetyStock: 50 },
      'PLANT-03': { onHand: 15, inTransit: 0, safetyStock: 20 },
    },
  },
  {
    code: 'MB-RED-001',
    name: 'Crimson Red Masterbatch (High Dispersion)',
    category: 'Color Masterbatch',
    uom: 'KG',
    unitCost: 240.00,
    moq: 100,
    leadTimeDays: 4,
    preferredSupplierId: 'SUP-003',
    preferredSupplierName: 'Clariant Masterbatches Ltd',
    plantStock: {
      'PLANT-01': { onHand: 8, inTransit: 0, safetyStock: 10 },
      'PLANT-02': { onHand: 4, inTransit: 0, safetyStock: 5 },
      'PLANT-03': { onHand: 6, inTransit: 10, safetyStock: 12 },
    },
  },
  {
    code: 'RM-HDL-STL-01',
    name: 'Galvanized Steel Wire Handle with Plastic Grip',
    category: 'Components',
    uom: 'PCS',
    unitCost: 12.50,
    moq: 5000,
    leadTimeDays: 7,
    preferredSupplierId: 'SUP-007',
    preferredSupplierName: 'Apex Wire & Hardware Works',
    plantStock: {
      'PLANT-01': { onHand: 9200, inTransit: 5000, safetyStock: 8000 },
      'PLANT-02': { onHand: 0, inTransit: 0, safetyStock: 0 },
      'PLANT-03': { onHand: 0, inTransit: 0, safetyStock: 0 },
    },
  },
  {
    code: 'PKG-BOX-500',
    name: '5-Ply Corrugated Outer Shipping Box (100 CTN Pack)',
    category: 'Packaging Materials',
    uom: 'PCS',
    unitCost: 35.00,
    moq: 1000,
    leadTimeDays: 4,
    preferredSupplierId: 'SUP-005',
    preferredSupplierName: 'Jayant Packaging Industries',
    plantStock: {
      'PLANT-01': { onHand: 240, inTransit: 200, safetyStock: 300 },
      'PLANT-02': { onHand: 100, inTransit: 0, safetyStock: 150 },
      'PLANT-03': { onHand: 80, inTransit: 0, safetyStock: 100 },
    },
  },
];

// Mapping of FG to Raw Material BOM recipe formulas (Unit material usage per 1 FG piece)
interface BomRecipeLine {
  materialCode: string;
  usagePerFg: number; // in UOM
  scrapAllowancePct: number;
}

const FG_BOM_RECIPES: { [fgCode: string]: BomRecipeLine[] } = {
  'FG-CTN-500': [
    { materialCode: 'RM-PP-NAT-001', usagePerFg: 0.0425, scrapAllowancePct: 1.5 },
    { materialCode: 'MB-BLU-001', usagePerFg: 0.00085, scrapAllowancePct: 1.0 },
    { materialCode: 'PKG-BOX-500', usagePerFg: 0.010, scrapAllowancePct: 0.0 },
  ],
  'FG-BKT-020': [
    { materialCode: 'RM-HDPE-001', usagePerFg: 0.850, scrapAllowancePct: 2.0 },
    { materialCode: 'MB-WHT-001', usagePerFg: 0.017, scrapAllowancePct: 1.0 },
    { materialCode: 'RM-HDL-STL-01', usagePerFg: 1.000, scrapAllowancePct: 0.5 },
  ],
  'FG-AUTO-012': [
    { materialCode: 'RM-ABS-BLK-001', usagePerFg: 0.185, scrapAllowancePct: 2.5 },
  ],
  'FG-AUTO-045': [
    { materialCode: 'RM-PP-CP-009', usagePerFg: 0.320, scrapAllowancePct: 2.0 },
  ],
  'FG-FLIP-28': [
    { materialCode: 'RM-PP-NAT-001', usagePerFg: 0.0048, scrapAllowancePct: 1.0 },
    { materialCode: 'MB-RED-001', usagePerFg: 0.00010, scrapAllowancePct: 1.0 },
  ],
  'FG-MED-VIAL-10': [
    { materialCode: 'RM-PET-MED-01', usagePerFg: 0.0125, scrapAllowancePct: 0.8 },
  ],
};

interface ScmMrpViewProps {
  items?: ItemMaster[];
  boms?: BomMaster[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmMrpView: React.FC<ScmMrpViewProps> = ({
  items = [],
  boms = [],
  onNavigate,
  showToast,
}) => {
  // Primary mode state: 'plantWise' or 'consolidated'
  const [viewMode, setViewMode] = useState<'plantWise' | 'consolidated'>('plantWise');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('PLANT-01');

  // Dynamic Monthly Sales Demand inputs (editable target quantities)
  const [salesDemands, setSalesDemands] = useState<MonthlySalesDemandItem[]>(INITIAL_MONTHLY_SALES_DEMANDS);

  // MRP Calculation Engine state
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [lastCalculatedTime, setLastCalculatedTime] = useState<string>('Just now');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [shortageOnlyFilter, setShortageOnlyFilter] = useState<boolean>(false);

  // PR Verification & Send Modal state
  const [isPrModalOpen, setIsPrModalOpen] = useState<boolean>(false);
  const [prPriority, setPrPriority] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('Urgent');
  const [prRequiredDate, setPrRequiredDate] = useState<string>('2026-09-06');
  const [prNotes, setPrNotes] = useState<string>(
    'Generated automatically via MRP BOM Explosion from September 2026 Monthly Sales Orders closing targets.'
  );
  const [prSelectedItems, setPrSelectedItems] = useState<{ [matCode: string]: boolean }>({});
  const [prCustomOrderQtys, setPrCustomOrderQtys] = useState<{ [matCode: string]: number }>({});
  const [dispatchedPrIds, setDispatchedPrIds] = useState<string[]>([]);

  // Editing monthly sales order demand input
  const handleUpdateDemandQty = (id: string, newTargetQty: number) => {
    const cleanQty = Math.max(0, isNaN(newTargetQty) ? 0 : newTargetQty);
    setSalesDemands((prev) =>
      prev.map((d) => (d.id === id ? { ...d, targetClosingQty: cleanQty } : d))
    );
  };

  const handleResetToConfirmedSo = () => {
    setSalesDemands((prev) =>
      prev.map((d) => ({ ...d, targetClosingQty: d.confirmedSoQty }))
    );
    showToast('Reset target sales quantities to exact confirmed monthly sales order volumes.');
  };

  const handleApplyBuffer = (pct: number) => {
    setSalesDemands((prev) =>
      prev.map((d) => ({
        ...d,
        targetClosingQty: Math.round(d.confirmedSoQty * (1 + pct / 100)),
      }))
    );
    showToast(`Applied +${pct}% buffer to all monthly sales closing targets.`);
  };

  const handleRunMRP = () => {
    setIsCalculating(true);
    showToast('Recomputing multi-plant BOM explosion against monthly sales order commitments...');
    setTimeout(() => {
      setIsCalculating(false);
      setLastCalculatedTime(new Date().toLocaleTimeString());
      showToast('MRP Calculation complete: Net shortages updated for procurement authorization.');
    }, 600);
  };

  // -------------------------------------------------------------
  // REAL-TIME MRP BOM EXPLOSION CALCULATION ENGINE
  // -------------------------------------------------------------
  const calculatedMrpResults = useMemo(() => {
    // 1. Calculate Gross Requirements per Material Code per Plant
    // demandMap[matCode][plantId] = grossRequirement
    const demandMap: { [matCode: string]: { [plantId: string]: number } } = {};
    const linkedFgMap: { [matCode: string]: Set<string> } = {};

    salesDemands.forEach((sd) => {
      const recipes = FG_BOM_RECIPES[sd.itemCode] || [];
      recipes.forEach((line) => {
        if (!demandMap[line.materialCode]) {
          demandMap[line.materialCode] = { 'PLANT-01': 0, 'PLANT-02': 0, 'PLANT-03': 0 };
          linkedFgMap[line.materialCode] = new Set<string>();
        }
        // Gross Demand = FG Target Closing Qty * Usage per FG * (1 + Scrap%)
        const grossQty = sd.targetClosingQty * line.usagePerFg * (1 + line.scrapAllowancePct / 100);
        demandMap[line.materialCode][sd.plantId] = (demandMap[line.materialCode][sd.plantId] || 0) + grossQty;
        linkedFgMap[line.materialCode].add(sd.itemCode);
      });
    });

    // 2. Iterate through Raw Materials Master and evaluate Stock vs Demand vs Shortage
    const results = RAW_MATERIALS_STOCK_DATA.map((mat) => {
      const p1Demand = demandMap[mat.code]?.['PLANT-01'] || 0;
      const p2Demand = demandMap[mat.code]?.['PLANT-02'] || 0;
      const p3Demand = demandMap[mat.code]?.['PLANT-03'] || 0;
      const totalGrossDemand = p1Demand + p2Demand + p3Demand;

      // Plant-wise available inventory: OnHand + InTransit - SafetyStock
      const p1Stock = mat.plantStock['PLANT-01'];
      const p2Stock = mat.plantStock['PLANT-02'];
      const p3Stock = mat.plantStock['PLANT-03'];

      const p1Available = p1Stock.onHand + p1Stock.inTransit - p1Stock.safetyStock;
      const p2Available = p2Stock.onHand + p2Stock.inTransit - p2Stock.safetyStock;
      const p3Available = p3Stock.onHand + p3Stock.inTransit - p3Stock.safetyStock;

      const p1Shortage = Math.max(0, p1Demand - Math.max(0, p1Available));
      const p2Shortage = Math.max(0, p2Demand - Math.max(0, p2Available));
      const p3Shortage = Math.max(0, p3Demand - Math.max(0, p3Available));

      // Consolidated metrics
      const consolidatedOnHand = p1Stock.onHand + p2Stock.onHand + p3Stock.onHand;
      const consolidatedInTransit = p1Stock.inTransit + p2Stock.inTransit + p3Stock.inTransit;
      const consolidatedSafetyStock = p1Stock.safetyStock + p2Stock.safetyStock + p3Stock.safetyStock;
      const consolidatedAvailable = consolidatedOnHand + consolidatedInTransit - consolidatedSafetyStock;
      const consolidatedShortage = Math.max(0, totalGrossDemand - Math.max(0, consolidatedAvailable));

      // Plant-wise active selection
      const activePlantDemand =
        selectedPlantId === 'PLANT-01' ? p1Demand : selectedPlantId === 'PLANT-02' ? p2Demand : p3Demand;
      const activePlantStock = mat.plantStock[selectedPlantId] || { onHand: 0, inTransit: 0, safetyStock: 0 };
      const activePlantShortage =
        selectedPlantId === 'PLANT-01' ? p1Shortage : selectedPlantId === 'PLANT-02' ? p2Shortage : p3Shortage;

      // Effective shortage based on viewMode
      const effectiveShortage = viewMode === 'consolidated' ? consolidatedShortage : activePlantShortage;
      const effectiveGrossDemand = viewMode === 'consolidated' ? totalGrossDemand : activePlantDemand;

      // Suggested Order Quantity rounded to Supplier MOQ
      let suggestedOrderQty = 0;
      if (effectiveShortage > 0) {
        suggestedOrderQty = Math.ceil(effectiveShortage / mat.moq) * mat.moq;
      }

      const estCost = suggestedOrderQty * mat.unitCost;

      // Priority determination
      let priority: 'Urgent' | 'High' | 'Normal' = 'Normal';
      if (effectiveShortage > 0) {
        const onHandCover =
          viewMode === 'consolidated' ? consolidatedOnHand : activePlantStock.onHand;
        if (onHandCover <= 0) priority = 'Urgent';
        else if (onHandCover < effectiveGrossDemand * 0.3) priority = 'High';
      }

      return {
        material: mat,
        grossDemand: effectiveGrossDemand,
        onHand: viewMode === 'consolidated' ? consolidatedOnHand : activePlantStock.onHand,
        inTransit: viewMode === 'consolidated' ? consolidatedInTransit : activePlantStock.inTransit,
        safetyStock: viewMode === 'consolidated' ? consolidatedSafetyStock : activePlantStock.safetyStock,
        netShortage: effectiveShortage,
        suggestedOrderQty,
        estCost,
        priority,
        linkedFgs: Array.from(linkedFgMap[mat.code] || []),
        plantBreakdown: {
          'PLANT-01': { demand: p1Demand, shortage: p1Shortage, stock: p1Stock },
          'PLANT-02': { demand: p2Demand, shortage: p2Shortage, stock: p2Stock },
          'PLANT-03': { demand: p3Demand, shortage: p3Shortage, stock: p3Stock },
        },
      };
    });

    return results;
  }, [salesDemands, viewMode, selectedPlantId]);

  // Total shortage lines ready for PR
  const shortageLines = useMemo(() => {
    return calculatedMrpResults.filter((r) => r.netShortage > 0);
  }, [calculatedMrpResults]);

  const totalShortageValue = useMemo(() => {
    return shortageLines.reduce((acc, r) => acc + r.estCost, 0);
  }, [shortageLines]);

  const totalGrossPolymerKg = useMemo(() => {
    return calculatedMrpResults
      .filter((r) => r.material.category === 'Virgin Polymer Resin')
      .reduce((acc, r) => acc + r.grossDemand, 0);
  }, [calculatedMrpResults]);

  const totalMonthlySalesUnits = useMemo(() => {
    const relevantDemands =
      viewMode === 'consolidated'
        ? salesDemands
        : salesDemands.filter((d) => d.plantId === selectedPlantId);
    return relevantDemands.reduce((acc, d) => acc + d.targetClosingQty, 0);
  }, [salesDemands, viewMode, selectedPlantId]);

  // Filtered MRP Table items
  const filteredMrpResults = useMemo(() => {
    return calculatedMrpResults.filter((r) => {
      const matchSearch =
        r.material.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.material.preferredSupplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'All' || r.material.category === categoryFilter;
      const matchShortage = !shortageOnlyFilter || r.netShortage > 0;
      return matchSearch && matchCategory && matchShortage;
    });
  }, [calculatedMrpResults, searchQuery, categoryFilter, shortageOnlyFilter]);

  const { paginatedData: paginatedResults, paginationProps } = usePagination(filteredMrpResults, {
    initialPageSize: 10,
    pageSizeOptions: [10, 20, 50],
  });

  // Open PR Modal with shortage items pre-selected
  const handleOpenPrModal = () => {
    if (shortageLines.length === 0) {
      showToast('No material shortages detected. All inventory requirements are satisfied.');
      return;
    }
    const initialSelected: { [code: string]: boolean } = {};
    const initialQtys: { [code: string]: number } = {};
    shortageLines.forEach((line) => {
      initialSelected[line.material.code] = true;
      initialQtys[line.material.code] = line.suggestedOrderQty;
    });
    setPrSelectedItems(initialSelected);
    setPrCustomOrderQtys(initialQtys);
    setIsPrModalOpen(true);
  };

  // -------------------------------------------------------------
  // VERIFY & SEND TO PR SCREEN (OUTSTANDING FOR APPROVAL)
  // -------------------------------------------------------------
  const handleVerifyAndDispatchPR = () => {
    const selectedLines = shortageLines.filter((l) => prSelectedItems[l.material.code]);
    if (selectedLines.length === 0) {
      showToast('Please select at least one material shortage item to create PR.');
      return;
    }

    const prNumber = `PR-${new Date().getFullYear()}-MRP-${Math.floor(100 + Math.random() * 900)}`;
    const targetPlantName =
      viewMode === 'consolidated'
        ? 'Enterprise Consolidated (Central Warehouse RM-WH-01)'
        : SCM_PLANTS.find((p) => p.id === selectedPlantId)?.name || 'RM-WH-01';

    const prLines: PurchaseRequisitionLine[] = selectedLines.map((line, idx) => {
      const orderQty = prCustomOrderQtys[line.material.code] || line.suggestedOrderQty;
      const lineTotal = orderQty * line.material.unitCost;
      return {
        id: `PRL-${prNumber}-${idx + 1}`,
        lineNo: idx + 1,
        itemCode: line.material.code,
        itemName: line.material.name,
        itemCategory: line.material.category,
        description: `MRP Shortage fulfillment for Monthly Sales Orders closing target. Linked FGs: ${line.linkedFgs.join(', ')}`,
        quantity: orderQty,
        uom: line.material.uom,
        requiredDate: prRequiredDate,
        suggestedSupplierId: line.material.preferredSupplierId,
        suggestedSupplierName: line.material.preferredSupplierName,
        estimatedUnitPrice: line.material.unitCost,
        estimatedTotal: lineTotal,
        salesOrderRef: `Monthly-SO-${selectedLines[0]?.linkedFgs[0] || 'Plan'}`,
        status: 'pending',
      };
    });

    const estimatedTotal = prLines.reduce((acc, l) => acc + l.estimatedTotal, 0);

    const newPurchaseRequisition: PurchaseRequisition = {
      id: prNumber,
      prNumber: prNumber,
      requestDate: new Date().toISOString().slice(0, 10),
      requestedBy: 'MRP Automated Engine (SCM Planning)',
      department: 'Supply Chain & Material Planning',
      plantWarehouse: targetPlantName,
      requiredDate: prRequiredDate,
      priority: prPriority,
      source: 'MRP',
      currency: 'INR (₹)',
      estimatedTotal: estimatedTotal,
      budgetAllocated: Math.round(estimatedTotal * 1.25),
      budgetRemaining: Math.round(estimatedTotal * 0.25),
      budgetExceeded: false,
      status: 'pending_approval',
      approvalStatus: 'pending',
      currentApprover: 'K. Ramanathan (Procurement VP)',
      justification: prNotes,
      notes: `Generated via MRP Workbench BOM Explosion (${viewMode === 'consolidated' ? 'Consolidated Multi-Plant' : selectedPlantId}) against September 2026 Monthly Sales Orders. Total ${prLines.length} raw material lines.`,
      lines: prLines,
      approvalHistory: [
        {
          step: 1,
          role: 'MRP System Engine',
          user: 'SCM Auto-Planner',
          action: 'Approved',
          date: new Date().toISOString().slice(0, 10),
          comment: `BOM exploded across ${salesDemands.length} monthly sales orders. Net shortages validated against live physical stocks.`,
        },
        {
          step: 2,
          role: 'Procurement VP',
          user: 'K. Ramanathan',
          action: 'Pending',
          comment: 'Awaiting commercial sign-off and PO dispatch.',
        },
      ],
    };

    // Save into global procurement dataset + localStorage
    addPurchaseRequisition(newPurchaseRequisition);
    setDispatchedPrIds((prev) => [prNumber, ...prev]);
    setIsPrModalOpen(false);

    showToast(`✅ Generated & Dispatched ${prNumber} (₹${(estimatedTotal / 100000).toFixed(2)}L) to PR Approval Workflow!`);

    // Direct user to PR Approval Screen Outstanding for Approval
    setTimeout(() => {
      onNavigate('purchaseApprovalWorkflow', { prId: prNumber });
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* MRP Header & Execution Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0F8B8D] border border-teal-200 font-mono text-xs font-bold uppercase">
              Material Requirements Planning (MRP)
            </span>
            <span className="text-xs text-slate-500">· Monthly Sales Order Connection &amp; BOM Explosion</span>
          </div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Plant-Wise &amp; Consolidated MRP Workbench
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Dynamically calculate gross polymer demands, additive dosages, and net material shortages driven by your <b>Monthly Sales Order Targets</b>. Verify calculations and dispatch formal Purchase Requisitions for executive approval.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunMRP}
            disabled={isCalculating}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin text-teal-400" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isCalculating ? 'Computing BOM Explosion...' : 'Re-Run MRP Calculation'}</span>
          </button>

          <button
            onClick={handleOpenPrModal}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              shortageLines.length > 0
                ? 'bg-[#E8622C] hover:bg-[#d45422] text-white animate-pulse'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Verify &amp; Send to PR Screen ({shortageLines.length} Short)</span>
          </button>
        </div>
      </div>

      {/* MODE SWITCHER: Plant-Wise Sales Connection vs All-Plant Consolidated */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Planning Mode:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('plantWise')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'plantWise'
                  ? 'bg-white text-[#14213D] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#0F8B8D]" />
              <span>Plant-Wise Sales Connection</span>
            </button>
            <button
              onClick={() => setViewMode('consolidated')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'consolidated'
                  ? 'bg-[#14213D] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>All-Plant Consolidated MRP</span>
            </button>
          </div>
        </div>

        {/* Plant Selector when in Plant-Wise mode */}
        {viewMode === 'plantWise' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active Plant:</span>
            <div className="flex items-center gap-1.5">
              {SCM_PLANTS.map((p) => {
                const isSelected = selectedPlantId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlantId(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.name.split(' - ')[0]} ({p.name.split(' - ')[1]?.split(' ')[0]})
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              <Globe className="w-3.5 h-3.5" />
              Aggregating Demands Across Plant 01 (Hosur), Plant 02 (Sanand) &amp; Plant 03 (Chennai)
            </span>
          </div>
        )}
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Monthly FG Target Sales</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              {totalMonthlySalesUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
            </div>
            <div className="text-[10px] text-slate-500">Target to close September commitments</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Gross Polymer Needed</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              {Math.round(totalGrossPolymerKg).toLocaleString()} <span className="text-xs font-normal text-slate-500">KG</span>
            </div>
            <div className="text-[10px] text-slate-500">PP, HDPE, ABS &amp; PET Resins</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Material Shortages</div>
            <div className="text-xl font-black text-rose-600 font-mono mt-0.5">
              {shortageLines.length} <span className="text-xs font-normal text-slate-500">Items Short</span>
            </div>
            <div className="text-[10px] text-rose-700 font-medium">Immediate PR authorization required</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#E8622C] flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Est. Shortage PR Value</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              ₹{(totalShortageValue / 100000).toFixed(2)} <span className="text-xs font-normal text-slate-500">Lakhs</span>
            </div>
            <div className="text-[10px] text-slate-500">MOQ rounded procurement cost</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MONTHLY SALES ORDER INPUT MATRIX */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                Input Driver
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Monthly Sales Order Target Matrix (Qty Needed to Close Sales)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit the <b>Target Closing Qty</b> for each Finished Good to immediately simulate exploded raw material requirements and plant shortages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToConfirmedSo}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Reset to Confirmed SOs
            </button>
            <button
              onClick={() => handleApplyBuffer(15)}
              className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0F8B8D] border border-teal-200 text-xs font-bold transition cursor-pointer"
            >
              +15% Buffer All
            </button>
          </div>
        </div>

        {/* Sales Demands Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">FG Item Code &amp; Description</th>
                <th className="p-3">Assigned Plant</th>
                <th className="p-3">Market Sector</th>
                <th className="p-3">Linked BOM</th>
                <th className="p-3 text-right">Confirmed SO Qty</th>
                <th className="p-3 text-right bg-amber-50/70 text-amber-900 border-x border-amber-200 font-bold">
                  Target Qty to Close Sales (Input)
                </th>
                <th className="p-3 text-right">Unit Weight</th>
                <th className="p-3 text-right">Gross Resin (KG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesDemands
                .filter((d) => viewMode === 'consolidated' || d.plantId === selectedPlantId)
                .map((demand) => {
                  const plantMeta = SCM_PLANTS.find((p) => p.id === demand.plantId);
                  const grossResinKg = (demand.targetClosingQty * demand.unitWeightKg * 1.015).toFixed(1);
                  return (
                    <tr key={demand.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{demand.itemCode}</div>
                        <div className="text-[11px] text-slate-500">{demand.itemName}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: plantMeta?.color || '#0F8B8D' }}
                        >
                          {plantMeta?.name.split(' - ')[0]}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{plantMeta?.location}</div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{demand.customerSegment}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] border border-indigo-200">
                          {demand.bomId}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-600">
                        {demand.confirmedSoQty.toLocaleString()} {demand.uom}
                      </td>
                      <td className="p-3 text-right bg-amber-50/40 border-x border-amber-200">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={demand.targetClosingQty}
                            onChange={(e) => handleUpdateDemandQty(demand.id, parseInt(e.target.value, 10))}
                            className="w-28 text-right font-mono font-bold text-sm bg-white border border-amber-300 focus:border-[#E8622C] focus:ring-1 focus:ring-[#E8622C] rounded-lg px-2.5 py-1 text-slate-900 shadow-2xs"
                          />
                          <span className="text-[10px] font-semibold text-slate-500">{demand.uom}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {(demand.unitWeightKg * 1000).toFixed(0)}g
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-teal-700">
                        {parseFloat(grossResinKg).toLocaleString()} KG
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: EXPLODED MATERIAL REQUIREMENTS & SHORTAGE WORKBENCH */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Table Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-50 text-[#0F8B8D] font-bold text-[10px] uppercase">
                BOM Explosion Output
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {viewMode === 'consolidated'
                  ? 'All-Plant Consolidated Raw Material Requirements & Shortages'
                  : `${SCM_PLANTS.find((p) => p.id === selectedPlantId)?.name} Material Requirements`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Net Shortage = Max(0, Gross Demand - [On-Hand + In-Transit - Safety Stock Buffer]).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Resin, Masterbatch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="All">All Material Categories</option>
              <option value="Virgin Polymer Resin">Virgin Polymer Resin</option>
              <option value="Color Masterbatch">Color Masterbatch</option>
              <option value="Packaging Materials">Packaging Materials</option>
              <option value="Components">Components / Inserts</option>
            </select>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={shortageOnlyFilter}
                onChange={(e) => setShortageOnlyFilter(e.target.checked)}
                className="rounded text-rose-600"
              />
              <span>Show Shortages Only</span>
            </label>
          </div>
        </div>

        {/* MRP Requirements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">Material Code &amp; Specification</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Gross Demand</th>
                <th className="p-3 text-right">On-Hand Stock</th>
                <th className="p-3 text-right">In-Transit</th>
                <th className="p-3 text-right">Safety Buffer</th>
                <th className="p-3 text-right bg-rose-50/70 text-rose-900 border-x border-rose-200">
                  Net Shortage
                </th>
                <th className="p-3 text-right">Suggested PR Qty (MOQ)</th>
                <th className="p-3">Preferred Supplier</th>
                <th className="p-3 text-right">Est. Cost</th>
                {viewMode === 'consolidated' && (
                  <th className="p-3 text-center">Plant Allocation (P1 / P2 / P3)</th>
                )}
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedResults.length > 0 ? (
                paginatedResults.map((row) => {
                  const isShort = row.netShortage > 0;
                  const isDispatched = dispatchedPrIds.length > 0 && isShort;
                  return (
                    <tr
                      key={row.material.code}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isShort ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{row.material.code}</div>
                        <div className="text-[11px] text-slate-500">{row.material.name}</div>
                        <div className="text-[10px] text-indigo-600 font-mono mt-0.5">
                          Linked: {row.linkedFgs.join(', ')}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {row.material.category.split(' ')[0]}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {Math.round(row.grossDemand).toLocaleString()} {row.material.uom}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-700">
                        {row.onHand.toLocaleString()} {row.material.uom}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {row.inTransit > 0 ? `+${row.inTransit.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {row.safetyStock.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold border-x border-rose-200 bg-rose-50/40 text-rose-600">
                        {isShort ? `${Math.round(row.netShortage).toLocaleString()} ${row.material.uom}` : '0'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {row.suggestedOrderQty > 0 ? (
                          <>
                            <span>{row.suggestedOrderQty.toLocaleString()} {row.material.uom}</span>
                            <span className="block text-[9px] text-slate-400 font-normal">
                              MOQ: {row.material.moq.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-emerald-600 font-normal">Stock Sufficient</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{row.material.preferredSupplierName}</div>
                        <div className="text-[10px] text-slate-400">Lead: {row.material.leadTimeDays} Days</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {row.estCost > 0 ? `₹${row.estCost.toLocaleString()}` : '—'}
                      </td>

                      {/* Plant Breakdown in Consolidated Mode */}
                      {viewMode === 'consolidated' && (
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 font-mono text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-bold" title="Plant 01 Hosur Demand">
                              P1: {Math.round(row.plantBreakdown['PLANT-01'].demand)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 font-bold" title="Plant 02 Sanand Demand">
                              P2: {Math.round(row.plantBreakdown['PLANT-02'].demand)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 font-bold" title="Plant 03 Chennai Demand">
                              P3: {Math.round(row.plantBreakdown['PLANT-03'].demand)}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="p-3 text-center">
                        {isShort ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                            Shortage Action
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Stock OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={viewMode === 'consolidated' ? 12 : 11} className="p-8 text-center text-slate-400">
                    No material requirements found matching active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar {...paginationProps} itemName="materials" />
      </div>

      {/* MODAL: VERIFY & SEND TO PR SCREEN OUTSTANDING FOR APPROVAL */}
      {isPrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-[#E8622C]/10 text-[#E8622C] font-bold text-xs uppercase font-mono">
                    PR Verification &amp; Authorization
                  </span>
                  <span className="text-xs text-slate-500">· SCM Engine</span>
                </div>
                <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
                  Verify &amp; Send to PR Screen (Outstanding for Approval)
                </h3>
              </div>
              <button
                onClick={() => setIsPrModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PR Configuration Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Target Plant Warehouse</label>
                <div className="font-bold text-slate-900">
                  {viewMode === 'consolidated'
                    ? 'RM-WH-01 (Consolidated Central Hub)'
                    : SCM_PLANTS.find((p) => p.id === selectedPlantId)?.name}
                </div>
                <div className="text-[11px] text-slate-500">Source: MRP Calculation Engine</div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Required Delivery Date</label>
                <input
                  type="date"
                  value={prRequiredDate}
                  onChange={(e) => setPrRequiredDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">PR Requisition Priority</label>
                <select
                  value={prPriority}
                  onChange={(e) => setPrPriority(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                >
                  <option value="Urgent">Urgent (Stockout Threat)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Replenishment</option>
                </select>
              </div>
            </div>

            {/* Itemized Verification Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Select Shortage Lines to Include in Purchase Requisition ({shortageLines.length} detected):
                </span>
                <span className="text-slate-500">
                  Total Requisition Value:{' '}
                  <strong className="text-slate-900 font-mono">
                    ₹
                    {shortageLines
                      .filter((l) => prSelectedItems[l.material.code])
                      .reduce((acc, l) => acc + (prCustomOrderQtys[l.material.code] || l.suggestedOrderQty) * l.material.unitCost, 0)
                      .toLocaleString()}
                  </strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Include</th>
                      <th className="p-2.5">Material Description</th>
                      <th className="p-2.5 text-right">Shortage</th>
                      <th className="p-2.5 text-right w-36">Order Qty (MOQ Adj)</th>
                      <th className="p-2.5">Supplier</th>
                      <th className="p-2.5 text-right">Est. Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shortageLines.map((line) => {
                      const isChecked = !!prSelectedItems[line.material.code];
                      const currentQty = prCustomOrderQtys[line.material.code] || line.suggestedOrderQty;
                      const lineTotal = currentQty * line.material.unitCost;
                      return (
                        <tr key={line.material.code} className={isChecked ? 'bg-white' : 'bg-slate-50 opacity-60'}>
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                setPrSelectedItems({ ...prSelectedItems, [line.material.code]: e.target.checked })
                              }
                              className="rounded text-[#E8622C] cursor-pointer"
                            />
                          </td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{line.material.code}</div>
                            <div className="text-[11px] text-slate-500">{line.material.name}</div>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                            {Math.round(line.netShortage).toLocaleString()} {line.material.uom}
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              min="1"
                              step={line.material.moq}
                              value={currentQty}
                              disabled={!isChecked}
                              onChange={(e) =>
                                setPrCustomOrderQtys({
                                  ...prCustomOrderQtys,
                                  [line.material.code]: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-24 text-right font-mono font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900"
                            />
                          </td>
                          <td className="p-2.5">
                            <div className="font-medium text-slate-800">{line.material.preferredSupplierName}</div>
                            <div className="text-[10px] text-slate-400">Lead: {line.material.leadTimeDays}d</div>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{lineTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Justification Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Justification Note (Sent to Procurement VP):
              </label>
              <textarea
                rows={2}
                value={prNotes}
                onChange={(e) => setPrNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsPrModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleVerifyAndDispatchPR}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8622C] hover:bg-[#d45422] text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Verify &amp; Send to PR Screen (Outstanding for Approval) &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
