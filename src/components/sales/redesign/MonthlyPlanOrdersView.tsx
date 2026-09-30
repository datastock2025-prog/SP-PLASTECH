import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Info,
  TrendingUp,
  AlertTriangle,
  Plus,
  Eye,
  CheckCircle,
  Link as LinkIcon,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  Building2,
  Package,
  X,
  Copy,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  FilePlus,
  Factory,
  CheckCircle2,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  FileSpreadsheet,
  Download,
  Lock,
  ExternalLink,
  RefreshCw,
  Percent,
  Sliders,
  Send,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import {
  MonthlyPlanOrder,
  PlasticSalesOrder,
} from '../../../types/salesOrderDeliveryTypes';
import { addPurchaseRequisition } from '../../../data/procurementData';
import { adminService, adminEventBus } from '../../../services/adminService';
import { masterDataGovernanceService } from '../../../services/masterDataGovernanceService';
import { PurchaseRequisition } from '../../../types/procurement';

interface MonthlyPlanOrdersViewProps {
  monthlyPlans: MonthlyPlanOrder[];
  dailyOrders: PlasticSalesOrder[];
  onNavigate: (view: string, param?: any) => void;
  onCreatePlan?: (plan: MonthlyPlanOrder) => void;
  initialCreateOpen?: boolean;
  onCloseCreateModal?: () => void;
  showToast: (msg: string) => void;
}

// Helper to advance month string e.g. "September 2026" -> "October 2026"
function getNextMonthPeriod(currentPeriod: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const parts = (currentPeriod || '').trim().split(' ');
  if (parts.length >= 2) {
    const monthName = parts[0];
    const year = parseInt(parts[1], 10);
    const mIdx = months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
    if (mIdx >= 0) {
      const nextIdx = (mIdx + 1) % 12;
      const nextYear = nextIdx === 0 ? year + 1 : year;
      return `${months[nextIdx]} ${nextYear}`;
    }
  }
  return 'October 2026';
}

// Flat Planned Line Item with parent metadata
export interface ConsolidatedPlanItem {
  id: string;
  planId: string;
  monthPeriod: string;
  customer: string;
  customerGstin: string;
  plant: string;
  fgStore: string;
  itemCode: string;
  itemName: string;
  customerItemCode?: string;
  hsn: string;
  plannedQty: number;
  deliveredQty: number;
  invoicedQty: number;
  remainingQty: number; // Tally: planned - delivered
  rate: number;
  totalValue: number;
  uom: string;
  status: string;
}

// Plant-wise Unit Sub-Plan with deterministic unique Plan ID (e.g. PLN-2026-09-U1)
export interface PlantUnitPlan {
  unitPlanId: string; // e.g. "PLN-2026-09-U1"
  plantName: string;
  plantCode: string;
  monthPeriod: string;
  parentPlanId: string;
  customers: string[];
  totalPlannedQty: number;
  totalDispatchedQty: number;
  pendingBalanceQty: number;
  totalPlannedValue: number;
  totalItemsCount: number;
  status: 'Partially Supplied' | 'Fully Supplied' | 'Active' | 'Variance';
  items: ConsolidatedPlanItem[];
}

// Month-Level Consolidated Master Plan
export interface MonthMasterPlan {
  monthKey: string; // e.g. "September 2026"
  planId: string; // e.g. "PLN-2026-09"
  monthPeriod: string;
  customers: string[];
  plants: string[];
  totalPlannedQty: number;
  totalDispatchedQty: number;
  pendingBalanceQty: number;
  totalPlannedValue: number;
  totalItemsCount: number;
  status: 'Partially Supplied' | 'Fully Supplied' | 'Active' | 'Variance';
  items: ConsolidatedPlanItem[];
  plantUnits: PlantUnitPlan[];
  rawPlans: MonthlyPlanOrder[];
}

// Exploded Raw Material line item connecting Planned Finished Goods to BOM requirements
export interface PlantBomExplodedItem {
  rawItemCode: string;
  rawItemName: string;
  category: string;
  grossRequiredKg: number;
  currentStockKg: number;
  safetyBufferKg: number;
  netNeedKg: number;
  unitPrice: number;
  totalCost: number;
  uom: string;
  suggestedSupplierId: string;
  suggestedSupplierName: string;
  secondarySupplierName?: string;
  leadTimeDays: number;
  supplierRating: number;
  stockStatus: 'Critical Shortage' | 'Partial Stock' | 'Sufficient Buffer';
}

// Advanced BOM Explosion Engine with Inventory Shortage & Supplier Intelligence
export function computePlantBomExplosion(plantName: string, items: ConsolidatedPlanItem[]): PlantBomExplodedItem[] {
  const totalFinishedGoodsPieces = items.reduce((sum, it) => sum + (it.plannedQty || 0), 0);
  const isHosur = plantName.toLowerCase().includes('hosur') || plantName.toLowerCase().includes('plant 1') || plantName.toLowerCase().includes('pimpri');
  const isChakan = plantName.toLowerCase().includes('chakan') || plantName.toLowerCase().includes('plant 2');

  const hasNylon = items.some((i) => (i.itemName || '').toLowerCase().includes('nylon') || (i.itemName || '').toLowerCase().includes('cowl') || (i.itemName || '').toLowerCase().includes('mudguard'));
  const hasABS = items.some((i) => (i.itemName || '').toLowerCase().includes('abs') || (i.itemName || '').toLowerCase().includes('bezel') || (i.itemName || '').toLowerCase().includes('trim'));

  const results: PlantBomExplodedItem[] = [];

  // 1. Virgin Polymer Raw Resin (Prime Virgin Grade)
  const resinMultiplier = hasNylon ? 0.52 : hasABS ? 0.48 : 0.425;
  const resinGrossKg = Math.round(totalFinishedGoodsPieces * resinMultiplier);
  const resinStockKg = isHosur ? 18500 : isChakan ? 12400 : 9800;
  const resinBufferKg = Math.round(resinGrossKg * 0.12);
  const resinNetKg = Math.max(0, resinGrossKg - resinStockKg + resinBufferKg);
  const resinRate = hasNylon ? 145.0 : hasABS ? 118.0 : 88.5;

  results.push({
    rawItemCode: hasNylon ? 'RM-PA6-GF30-01' : hasABS ? 'RM-ABS-HI121-02' : 'RM-PP-NAT-001',
    rawItemName: hasNylon
      ? 'Polyamide 6 (Nylon 6) 30% Glass Filled Granules'
      : hasABS
      ? 'ABS Injection Grade Virgin Polymer Resin HI-121'
      : 'Polypropylene Injection Grade Virgin Resin H110MA',
    category: 'Polymer Granules',
    grossRequiredKg: resinGrossKg,
    currentStockKg: resinStockKg,
    safetyBufferKg: resinBufferKg,
    netNeedKg: resinNetKg,
    unitPrice: resinRate,
    totalCost: resinNetKg * resinRate,
    uom: 'KG',
    suggestedSupplierId: 'SUP-S0128',
    suggestedSupplierName: 'RELIANCE INDUSTRIES LIMITED',
    secondarySupplierName: 'IOCL Polymers Division',
    leadTimeDays: 3,
    supplierRating: 98.5,
    stockStatus: resinNetKg > 15000 ? 'Critical Shortage' : resinNetKg > 0 ? 'Partial Stock' : 'Sufficient Buffer',
  });

  // 2. High Concentration Color Masterbatch (2% to 3% dosage)
  const mbGrossKg = Math.round(totalFinishedGoodsPieces * 0.015);
  const mbStockKg = isHosur ? 650 : isChakan ? 420 : 310;
  const mbBufferKg = Math.round(mbGrossKg * 0.15);
  const mbNetKg = Math.max(0, mbGrossKg - mbStockKg + mbBufferKg);
  const mbRate = 340.0;

  results.push({
    rawItemCode: 'MB-BLK-002',
    rawItemName: 'Carbon Black Masterbatch 40% Concentration (Automotive Grade)',
    category: 'Color Masterbatch',
    grossRequiredKg: mbGrossKg,
    currentStockKg: mbStockKg,
    safetyBufferKg: mbBufferKg,
    netNeedKg: mbNetKg,
    unitPrice: mbRate,
    totalCost: mbNetKg * mbRate,
    uom: 'KG',
    suggestedSupplierId: 'SUP-S0045',
    suggestedSupplierName: 'CLARIANT COLORANTS CHEMICALS INDIA',
    secondarySupplierName: 'Supreme Masterbatch Ltd',
    leadTimeDays: 5,
    supplierRating: 97.2,
    stockStatus: mbNetKg > 500 ? 'Critical Shortage' : mbNetKg > 0 ? 'Partial Stock' : 'Sufficient Buffer',
  });

  // 3. Functional Additives (UV / Impact Modifier)
  const addGrossKg = Math.round(totalFinishedGoodsPieces * 0.005);
  const addStockKg = isHosur ? 140 : isChakan ? 85 : 60;
  const addBufferKg = Math.round(addGrossKg * 0.15);
  const addNetKg = Math.max(0, addGrossKg - addStockKg + addBufferKg);
  const addRate = 520.0;

  results.push({
    rawItemCode: 'AD-UV-STAB-003',
    rawItemName: 'UV Stabilizer, Thermal Antioxidant & Clarifier Additive',
    category: 'Performance Additive',
    grossRequiredKg: addGrossKg,
    currentStockKg: addStockKg,
    safetyBufferKg: addBufferKg,
    netNeedKg: addNetKg,
    unitPrice: addRate,
    totalCost: addNetKg * addRate,
    uom: 'KG',
    suggestedSupplierId: 'SUP-S0078',
    suggestedSupplierName: 'BASF PERFORMANCE CHEMICALS INDIA',
    secondarySupplierName: 'Solvay Special Chemicals Ltd',
    leadTimeDays: 7,
    supplierRating: 99.1,
    stockStatus: addNetKg > 100 ? 'Critical Shortage' : addNetKg > 0 ? 'Partial Stock' : 'Sufficient Buffer',
  });

  // 4. Heavy-Duty Corrugated Master Shipping Boxes (5-Ply)
  const boxGross = Math.ceil(totalFinishedGoodsPieces / 40);
  const boxStock = isHosur ? 920 : isChakan ? 580 : 450;
  const boxBuffer = Math.round(boxGross * 0.10);
  const boxNet = Math.max(0, boxGross - boxStock + boxBuffer);
  const boxRate = 65.0;

  results.push({
    rawItemCode: 'PKG-BOX-5PLY-01',
    rawItemName: '5-Ply Heavy-Duty Corrugated Outer Master Cartons (Printed)',
    category: 'Secondary Packaging',
    grossRequiredKg: boxGross,
    currentStockKg: boxStock,
    safetyBufferKg: boxBuffer,
    netNeedKg: boxNet,
    unitPrice: boxRate,
    totalCost: boxNet * boxRate,
    uom: 'BOX',
    suggestedSupplierId: 'SUP-S0164',
    suggestedSupplierName: 'PARKSONS PACKAGING LTD',
    secondarySupplierName: 'Uflex Packaging Division',
    leadTimeDays: 2,
    supplierRating: 96.8,
    stockStatus: boxNet > 800 ? 'Critical Shortage' : boxNet > 0 ? 'Partial Stock' : 'Sufficient Buffer',
  });

  return results;
}

export const MonthlyPlanOrdersView: React.FC<MonthlyPlanOrdersViewProps> = ({
  monthlyPlans: propPlans,
  dailyOrders,
  onNavigate,
  onCreatePlan,
  initialCreateOpen = false,
  onCloseCreateModal,
  showToast,
}) => {
  const [plans, setPlans] = useState<MonthlyPlanOrder[]>(propPlans);
  const [activeTab, setActiveTab] = useState<string>('All Plans');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically load all created plants from Master Data & Admin Service and track plant creation events
  const [createdPlants, setCreatedPlants] = useState<Array<{ id: string; code?: string; name: string; location?: string }>>(() => {
    return masterDataGovernanceService.getPlants();
  });

  useEffect(() => {
    const refreshPlants = () => {
      const govPlants = masterDataGovernanceService.getPlants();
      adminService.getPlants().then((live) => {
        const map = new Map<string, { id: string; code?: string; name: string; location?: string }>();
        govPlants.forEach((p) => map.set(p.code || p.id, p));
        (live || []).forEach((p) => map.set(p.code || p.id, { id: p.id, code: p.code, name: p.name, location: p.location }));
        setCreatedPlants(Array.from(map.values()));
      }).catch(() => {
        setCreatedPlants(govPlants);
      });
    };

    refreshPlants();
    adminEventBus.on('PLANT_CREATED', refreshPlants);
    adminEventBus.on('PLANT_UPDATED', refreshPlants);
    adminEventBus.on('PLANT_DELETED', refreshPlants);
    adminEventBus.on('PLANT_MASTER_SAVED', refreshPlants);
    adminEventBus.on('CATALOG_RELOADED', refreshPlants);
    return () => {
      adminEventBus.off('PLANT_CREATED', refreshPlants);
      adminEventBus.off('PLANT_UPDATED', refreshPlants);
      adminEventBus.off('PLANT_DELETED', refreshPlants);
      adminEventBus.off('PLANT_MASTER_SAVED', refreshPlants);
      adminEventBus.off('CATALOG_RELOADED', refreshPlants);
    };
  }, []);

  // Operational View Scope Options: "All Units" + All Created Manufacturing Plants (Clean, no duplicates/undefined)
  const plantScopeOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; shortName: string; code?: string }> = [
      { id: 'All Plants', label: 'All Units', shortName: 'All Units' },
    ];

    const seen = new Set<string>();
    seen.add('all plants');
    seen.add('all units');
    seen.add('undefined');
    seen.add('null');

    createdPlants.forEach((p) => {
      if (!p) return;
      const rawName = (p.name || p.code || p.id || '').trim();
      if (!rawName || rawName === 'undefined' || rawName === 'null') return;
      const key = rawName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        options.push({
          id: rawName,
          label: `${rawName}${p.location ? ` (${p.location})` : ''}`,
          shortName: p.name || p.code || rawName,
          code: p.code || p.id,
        });
      }
    });

    // Also include any plant listed in existing monthly plans
    (propPlans || []).forEach((plan) => {
      if (plan && plan.plant && typeof plan.plant === 'string') {
        const rawPlant = plan.plant.trim();
        if (rawPlant && rawPlant !== 'undefined' && rawPlant !== 'null') {
          const key = rawPlant.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            options.push({
              id: rawPlant,
              label: rawPlant,
              shortName: rawPlant,
              code: rawPlant,
            });
          }
        }
      }
    });

    return options;
  }, [createdPlants, propPlans]);

  // Login plant awareness: if user is assigned to e.g. Plant 1, scope initializes to that plant
  const [selectedPlantScope, setSelectedPlantScope] = useState<string>(() => {
    const activeStored = localStorage.getItem('sp_active_plant');
    if (activeStored && activeStored !== 'PLANT-01' && activeStored !== 'ALL') {
      return activeStored;
    }
    // Check if logged-in plant is Plant 1 / specific
    if (activeStored === 'PLANT-01') return 'Plant 1';
    return 'All Plants';
  });

  const [isPlantScopeDropdownOpen, setIsPlantScopeDropdownOpen] = useState<boolean>(false);
  const [plantScopeSearch, setPlantScopeSearch] = useState<string>('');

  // Task-4: Raise PR Workbench Modal State with Full In-Grid CRUD & 10,000+ Items Scalability
  const [isSalesPrModalOpen, setIsSalesPrModalOpen] = useState<boolean>(false);
  const [selectedSalesPrUnit, setSelectedSalesPrUnit] = useState<PlantUnitPlan | null>(null);
  const [prDraftItems, setPrDraftItems] = useState<ConsolidatedPlanItem[]>([]);
  const [prSearchQuery, setPrSearchQuery] = useState<string>('');
  const [prCustomerFilter, setPrCustomerFilter] = useState<string>('All');
  const [prPage, setPrPage] = useState<number>(1);
  const [prPageSize, setPrPageSize] = useState<number>(10);
  const [isAddPrItemModalOpen, setIsAddPrItemModalOpen] = useState<boolean>(false);
  const [newPrItemCode, setNewPrItemCode] = useState<string>('');
  const [newPrItemName, setNewPrItemName] = useState<string>('');
  const [newPrItemCustomer, setNewPrItemCustomer] = useState<string>('');
  const [newPrItemQty, setNewPrItemQty] = useState<string>('5000');
  const [newPrItemRate, setNewPrItemRate] = useState<string>('45.00');
  const [newPrItemStore, setNewPrItemStore] = useState<string>('FG-Automotive Cell');
  const [newPrItemDate, setNewPrItemDate] = useState<string>(() => new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10));

  // View Mode: 'master' | 'monthDetail' | 'duplicateWorkbench'
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false);
  const [duplicateSourceMonth, setDuplicateSourceMonth] = useState<MonthMasterPlan | null>(null);

  // Pagination for Master Grid
  const [masterPage, setMasterPage] = useState(1);
  const [masterPageSize, setMasterPageSize] = useState(5);

  // Pagination for Month Detailed Items Grid
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemPlantFilter, setItemPlantFilter] = useState('All');
  const [itemCustomerFilter, setItemCustomerFilter] = useState('All');

  // Selected item checkboxes for batch operations
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});

  // Modals (Initial Create Plan)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialCreateOpen);

  // Synchronize with parent props
  useEffect(() => {
    if (propPlans && propPlans.length > 0) {
      setPlans(propPlans);
    }
  }, [propPlans]);

  useEffect(() => {
    if (initialCreateOpen) {
      setIsCreateModalOpen(true);
    }
  }, [initialCreateOpen]);

  // Form State for creating a brand new plan
  const [newPlanCustomer, setNewPlanCustomer] = useState('Tata Motors Passenger Vehicles Ltd');
  const [newPlanMonth, setNewPlanMonth] = useState('October 2026');
  const [newPlanType, setNewPlanType] = useState<'Monthly supply plan' | 'Forecast' | 'Rate contract' | 'Billable monthly order'>('Monthly supply plan');
  const [newPlanPlant, setNewPlanPlant] = useState('Plant 1 - Pimpri Auto-Hub');
  const [newPlanItemCode, setNewPlanItemCode] = useState('FG-AUTO-012');
  const [newPlanItemName, setNewPlanItemName] = useState('ABS Dashboard Trim Bezel (Matte Black)');
  const [newPlanQty, setNewPlanQty] = useState('25000');
  const [newPlanRate, setNewPlanRate] = useState('42.50');
  const [newPlanNotes, setNewPlanNotes] = useState('Committed monthly call-off schedule based on OEM production forecasts.');

  // Form & Workbench State for Dedicated Duplication Screen
  const [dupSelectedMonth, setDupSelectedMonth] = useState('October');
  const [dupSelectedYear, setDupSelectedYear] = useState('2026');
  const [dupNotes, setDupNotes] = useState('');
  const [customAdjustmentPct, setCustomAdjustmentPct] = useState<string>('2');
  const [dupItems, setDupItems] = useState<
    Array<{
      id: string;
      customer: string;
      customerGstin: string;
      plant: string;
      fgStore: string;
      itemCode: string;
      itemName: string;
      prevPlannedQty: number;
      prevDispatchedQty: number;
      newPlannedQty: number;
      rate: number; // Master Price (Read-only)
      uom: string;
    }>
  >([]);

  // Pagination & Filtering for Dedicated Duplication Screen (Scalable for 10,000+ items)
  const [dupPage, setDupPage] = useState(1);
  const [dupPageSize, setDupPageSize] = useState(10);
  const [dupSearchQuery, setDupSearchQuery] = useState('');
  const [dupCustomerFilter, setDupCustomerFilter] = useState('All');
  const [dupPlantFilter, setDupPlantFilter] = useState('All');

  // Consolidated Master Plans: Grouped as One Plan ID per Month Period
  const monthMasterPlans: MonthMasterPlan[] = useMemo(() => {
    const monthGroups: Record<string, MonthlyPlanOrder[]> = {};

    plans.forEach((plan) => {
      const mPeriod = (plan.monthPeriod || 'September 2026').trim();
      if (!monthGroups[mPeriod]) {
        monthGroups[mPeriod] = [];
      }
      monthGroups[mPeriod].push(plan);
    });

    return Object.entries(monthGroups).map(([monthPeriod, groupPlans]) => {
      const monthsMap: Record<string, string> = {
        january: '01', february: '02', march: '03', april: '04',
        may: '05', june: '06', july: '07', august: '08',
        september: '09', october: '10', november: '11', december: '12',
      };
      const parts = monthPeriod.split(' ');
      const mName = (parts[0] || '').toLowerCase();
      const yr = parts[1] || '2026';
      const mCode = monthsMap[mName] || '09';
      const consolidatedPlanId = `PLN-${yr}-${mCode}`;

      const allItems: ConsolidatedPlanItem[] = [];
      const customersSet = new Set<string>();
      const plantsSet = new Set<string>();

      let totalPlanned = 0;
      let totalDispatched = 0;
      let totalVal = 0;

      groupPlans.forEach((plan) => {
        customersSet.add(plan.customer);
        if (plan.plant) plantsSet.add(plan.plant);

        (plan.items || []).forEach((it, idx) => {
          const planned = Number(it.plannedQty) || 0;
          const dispatched = Number(it.deliveredQty) || 0;
          const invoiced = Number(it.invoicedQty) || 0;
          const pending = planned - dispatched;
          const rate = Number(it.rate) || 0;
          const lineVal = planned * rate;

          totalPlanned += planned;
          totalDispatched += dispatched;
          totalVal += lineVal;

          allItems.push({
            id: `${plan.id}-ITM-${idx + 1}`,
            planId: plan.id,
            monthPeriod,
            customer: plan.customer,
            customerGstin: plan.customerGstin || '27AAACG0943A1ZX',
            plant: it.plant || plan.plant,
            fgStore: it.fgStore || plan.fgStore,
            itemCode: it.itemCode,
            itemName: it.itemName,
            customerItemCode: it.customerItemCode,
            hsn: it.hsn || '39269099',
            plannedQty: planned,
            deliveredQty: dispatched,
            invoicedQty: invoiced,
            remainingQty: pending,
            rate,
            totalValue: lineVal,
            uom: it.uom || 'PCS',
            status:
              dispatched >= planned
                ? 'Fully Supplied'
                : dispatched > 0
                ? 'Partially Supplied'
                : 'Pending Supply',
          });
        });
      });

      const pendingBal = totalPlanned - totalDispatched;
      let status: 'Partially Supplied' | 'Fully Supplied' | 'Active' | 'Variance' = 'Active';
      if (totalDispatched >= totalPlanned && totalPlanned > 0) {
        status = 'Fully Supplied';
      } else if (totalDispatched > 0) {
        status = 'Partially Supplied';
      }

      // Group items by plant to create unique plant unit sub-plans with their own Plan IDs (Task-2)
      const plantGroupsMap: Record<string, ConsolidatedPlanItem[]> = {};
      allItems.forEach((it) => {
        const pKey = it.plant || 'Plant 1 - Pimpri Auto-Hub';
        if (!plantGroupsMap[pKey]) plantGroupsMap[pKey] = [];
        plantGroupsMap[pKey].push(it);
      });

      const plantUnits: PlantUnitPlan[] = Object.entries(plantGroupsMap).map(([pName, pItems], pIdx) => {
        let unitSuffix = `U${pIdx + 1}`;
        const pLower = pName.toLowerCase();
        if (pLower.includes('plant 1') || pLower.includes('pimpri') || pLower.includes('plant-01')) {
          unitSuffix = 'U1';
        } else if (pLower.includes('plant 2') || pLower.includes('chakan') || pLower.includes('plant-02')) {
          unitSuffix = 'U2';
        } else if (pLower.includes('plant 3') || pLower.includes('sanand') || pLower.includes('plant-03')) {
          unitSuffix = 'U3';
        } else if (pLower.includes('plant 4') || pLower.includes('chennai') || pLower.includes('plant-04')) {
          unitSuffix = 'U4';
        }

        const unitPlanId = `${consolidatedPlanId}-${unitSuffix}`;
        const unitPlanned = pItems.reduce((s, i) => s + i.plannedQty, 0);
        const unitDispatched = pItems.reduce((s, i) => s + i.deliveredQty, 0);
        const unitVal = pItems.reduce((s, i) => s + i.totalValue, 0);
        const unitCusts = Array.from(new Set(pItems.map((i) => i.customer)));
        const unitBalance = unitPlanned - unitDispatched;

        let unitStatus: 'Partially Supplied' | 'Fully Supplied' | 'Active' | 'Variance' = 'Active';
        if (unitDispatched >= unitPlanned && unitPlanned > 0) {
          unitStatus = 'Fully Supplied';
        } else if (unitDispatched > 0) {
          unitStatus = 'Partially Supplied';
        }

        return {
          unitPlanId,
          plantName: pName,
          plantCode: `PLANT-0${unitSuffix.replace('U', '')}`,
          monthPeriod,
          parentPlanId: consolidatedPlanId,
          customers: unitCusts,
          totalPlannedQty: unitPlanned,
          totalDispatchedQty: unitDispatched,
          pendingBalanceQty: unitBalance,
          totalPlannedValue: unitVal,
          totalItemsCount: pItems.length,
          status: unitStatus,
          items: pItems,
        };
      });

      return {
        monthKey: monthPeriod,
        planId: consolidatedPlanId,
        monthPeriod,
        customers: Array.from(customersSet),
        plants: Array.from(plantsSet),
        totalPlannedQty: totalPlanned,
        totalDispatchedQty: totalDispatched,
        pendingBalanceQty: pendingBal,
        totalPlannedValue: totalVal,
        totalItemsCount: allItems.length,
        status,
        items: allItems,
        plantUnits,
        rawPlans: groupPlans,
      };
    });
  }, [plans]);

  // Active Selected Month Master Plan (if drilled down)
  const currentSelectedMonthPlan = useMemo(() => {
    if (!selectedMonthKey) return null;
    return monthMasterPlans.find((m) => m.monthKey === selectedMonthKey) || null;
  }, [monthMasterPlans, selectedMonthKey]);

  // Summary Metrics across all months
  const totalMonthlyMasterPlans = monthMasterPlans.length;
  const overallPlannedQty = monthMasterPlans.reduce((sum, p) => sum + p.totalPlannedQty, 0);
  const overallDispatchedQty = monthMasterPlans.reduce((sum, p) => sum + p.totalDispatchedQty, 0);
  const overallRemainingTally = overallPlannedQty - overallDispatchedQty;
  const overallPlannedValue = monthMasterPlans.reduce((sum, p) => sum + p.totalPlannedValue, 0);

  // Filter Master Monthly Plans and scope strictly to selected plant if chosen
  const filteredMasterPlans = useMemo(() => {
    return monthMasterPlans
      .map((plan) => {
        if (selectedPlantScope === 'All Plants') return plan;

        const scopeLower = selectedPlantScope.toLowerCase();
        // Match items by plant name, code, or identifier
        const matchingItems = plan.items.filter((it) => {
          const itemPlant = (it.plant || '').toLowerCase();
          return (
            itemPlant.includes(scopeLower) ||
            scopeLower.includes(itemPlant) ||
            (scopeLower.includes('plant 1') && itemPlant.includes('plant 1')) ||
            (scopeLower.includes('plant 2') && itemPlant.includes('plant 2')) ||
            (scopeLower.includes('plant 3') && itemPlant.includes('plant 3')) ||
            (scopeLower.includes('plant 4') && itemPlant.includes('plant 4'))
          );
        });

        if (matchingItems.length === 0) return null;

        const totalPlanned = matchingItems.reduce((s, it) => s + it.plannedQty, 0);
        const totalDispatched = matchingItems.reduce((s, it) => s + it.deliveredQty, 0);
        const totalVal = matchingItems.reduce((s, it) => s + it.totalValue, 0);
        const pendingBal = totalPlanned - totalDispatched;
        const matchingPlants = Array.from(new Set(matchingItems.map((i) => i.plant)));
        const matchingCustomers = Array.from(new Set(matchingItems.map((i) => i.customer)));

        return {
          ...plan,
          customers: matchingCustomers,
          plants: matchingPlants,
          totalPlannedQty: totalPlanned,
          totalDispatchedQty: totalDispatched,
          pendingBalanceQty: pendingBal,
          totalPlannedValue: totalVal,
          totalItemsCount: matchingItems.length,
          items: matchingItems,
        };
      })
      .filter((plan): plan is MonthMasterPlan => {
        if (!plan) return false;

        if (activeTab === 'Partially Supplied' && plan.status !== 'Partially Supplied') return false;
        if (activeTab === 'Fully Supplied' && plan.status !== 'Fully Supplied') return false;
        if (activeTab === 'Active' && plan.status !== 'Active') return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchId = plan.planId.toLowerCase().includes(q);
          const matchPeriod = plan.monthPeriod.toLowerCase().includes(q);
          const matchCust = plan.customers.some((c) => c.toLowerCase().includes(q));
          const matchPlant = plan.plants.some((p) => p.toLowerCase().includes(q));
          const matchItem = plan.items.some(
            (i) => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
          );
          if (!matchId && !matchPeriod && !matchCust && !matchPlant && !matchItem) return false;
        }
        return true;
      });
  }, [monthMasterPlans, activeTab, searchQuery, selectedPlantScope]);

  // Master Pagination
  const totalMasterPages = Math.ceil(filteredMasterPlans.length / masterPageSize) || 1;
  const paginatedMasterPlans = useMemo(() => {
    const start = (masterPage - 1) * masterPageSize;
    return filteredMasterPlans.slice(start, start + masterPageSize);
  }, [filteredMasterPlans, masterPage, masterPageSize]);

  // Month Detail Page: Filter & Paginate Items
  const filteredMonthItems = useMemo(() => {
    if (!currentSelectedMonthPlan) return [];
    return currentSelectedMonthPlan.items.filter((item) => {
      if (itemPlantFilter !== 'All' && item.plant !== itemPlantFilter) return false;
      if (itemCustomerFilter !== 'All' && item.customer !== itemCustomerFilter) return false;

      if (itemSearchQuery) {
        const q = itemSearchQuery.toLowerCase();
        const matchCode = item.itemCode.toLowerCase().includes(q);
        const matchName = item.itemName.toLowerCase().includes(q);
        const matchCust = item.customer.toLowerCase().includes(q);
        const matchPlant = item.plant.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCust && !matchPlant) return false;
      }
      return true;
    });
  }, [currentSelectedMonthPlan, itemPlantFilter, itemCustomerFilter, itemSearchQuery]);

  const totalItemPages = Math.ceil(filteredMonthItems.length / itemPageSize) || 1;
  const paginatedMonthItems = useMemo(() => {
    const start = (itemPage - 1) * itemPageSize;
    return filteredMonthItems.slice(start, start + itemPageSize);
  }, [filteredMonthItems, itemPage, itemPageSize]);

  // Dedicated Duplication Screen: Filter & Paginate dupItems
  const filteredDupItems = useMemo(() => {
    return dupItems.filter((item) => {
      if (dupCustomerFilter !== 'All' && item.customer !== dupCustomerFilter) return false;
      if (dupPlantFilter !== 'All' && item.plant !== dupPlantFilter) return false;

      if (dupSearchQuery) {
        const q = dupSearchQuery.toLowerCase();
        const matchCode = item.itemCode.toLowerCase().includes(q);
        const matchName = item.itemName.toLowerCase().includes(q);
        const matchCust = item.customer.toLowerCase().includes(q);
        const matchPlant = item.plant.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCust && !matchPlant) return false;
      }
      return true;
    });
  }, [dupItems, dupCustomerFilter, dupPlantFilter, dupSearchQuery]);

  const totalDupPages = Math.ceil(filteredDupItems.length / dupPageSize) || 1;
  const paginatedDupItems = useMemo(() => {
    const start = (dupPage - 1) * dupPageSize;
    return filteredDupItems.slice(start, start + dupPageSize);
  }, [filteredDupItems, dupPage, dupPageSize]);

  // Duplication Screen Totals
  const dupTotalPlannedQty = useMemo(() => {
    return dupItems.reduce((sum, it) => sum + (Number(it.newPlannedQty) || 0), 0);
  }, [dupItems]);

  const dupTotalPlannedValue = useMemo(() => {
    return dupItems.reduce((sum, it) => sum + ((Number(it.newPlannedQty) || 0) * (Number(it.rate) || 0)), 0);
  }, [dupItems]);

  const dupEstimatedPolymerKg = Math.round(dupTotalPlannedQty * 0.45);

  // Handle Master Row Click to Drill Down into Month Detail Grid
  const handleOpenMonthDetail = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    setIsDuplicating(false);
    setItemPage(1);
    setItemSearchQuery('');
    setItemPlantFilter('All');
    setItemCustomerFilter('All');
    setSelectedItemIds({});
  };

  // Open Dedicated Duplication Screen for a Month Master Plan
  const handleOpenDuplicateWorkbench = (monthPlan: MonthMasterPlan, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDuplicateSourceMonth(monthPlan);
    setIsDuplicating(true);
    setSelectedMonthKey(null);

    const nextM = getNextMonthPeriod(monthPlan.monthPeriod);
    const parts = nextM.split(' ');
    setDupSelectedMonth(parts[0] || 'October');
    setDupSelectedYear(parts[1] || '2026');
    setDupNotes(`Consolidated monthly demand roll-forward from ${monthPlan.monthPeriod} (${monthPlan.planId}) with tuned production forecast.`);

    setDupItems(
      monthPlan.items.map((i) => ({
        id: i.id,
        customer: i.customer,
        customerGstin: i.customerGstin,
        plant: i.plant,
        fgStore: i.fgStore,
        itemCode: i.itemCode,
        itemName: i.itemName,
        prevPlannedQty: i.plannedQty,
        prevDispatchedQty: i.deliveredQty,
        newPlannedQty: i.plannedQty, // User can freely edit
        rate: i.rate, // Read-only from Price Master
        uom: i.uom,
      }))
    );

    setDupPage(1);
    setDupSearchQuery('');
    setDupCustomerFilter('All');
    setDupPlantFilter('All');
  };

  // Bulk adjustment helper on duplication workbench
  const handleApplyGrowthPercentage = (pct: number) => {
    setDupItems((prev) =>
      prev.map((it) => ({
        ...it,
        newPlannedQty: Math.round(it.prevPlannedQty * (1 + pct / 100)),
      }))
    );
    showToast(`Applied ${pct > 0 ? `+${pct}%` : `${pct}%`} forecast adjustment across all ${dupItems.length} planned items.`);
  };

  const handleCopyPrevDispatchedAll = () => {
    setDupItems((prev) =>
      prev.map((it) => ({
        ...it,
        newPlannedQty: it.prevDispatchedQty > 0 ? it.prevDispatchedQty : it.prevPlannedQty,
      }))
    );
    showToast('Updated planned quantities to match previous month dispatched actuals.');
  };

  // Task-2 & Task-4: Open Raise PR Workbench Modal for a specific Plant Unit
  const handleOpenRaisePrForUnit = (unit: PlantUnitPlan, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSalesPrUnit(unit);
    // Deep clone unit's items so user can edit/add/delete without affecting master until submission
    setPrDraftItems(JSON.parse(JSON.stringify(unit.items)));
    setPrSearchQuery('');
    setPrCustomerFilter('All');
    setPrPage(1);
    setNewPrItemCustomer(unit.customers[0] || 'Tata Motors Passenger Vehicles Ltd');
    setNewPrItemStore(unit.items[0]?.fgStore || 'FG-Automotive Cell');
    setIsSalesPrModalOpen(true);
  };

  // In-line update quantity on PR draft
  const handleUpdatePrDraftItemQty = (id: string, qty: number) => {
    setPrDraftItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const safeQty = Math.max(0, isNaN(qty) ? 0 : qty);
          return {
            ...it,
            plannedQty: safeQty,
            remainingQty: Math.max(0, safeQty - it.deliveredQty),
            totalValue: safeQty * it.rate,
          };
        }
        return it;
      })
    );
  };

  // In-line update FG Store on PR draft
  const handleUpdatePrDraftItemStore = (id: string, store: string) => {
    setPrDraftItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, fgStore: store } : it))
    );
  };

  // Delete line item from PR draft
  const handleDeletePrDraftItem = (id: string) => {
    setPrDraftItems((prev) => prev.filter((it) => it.id !== id));
    showToast('Item removed from Purchase Requisition draft.');
  };

  // Add new line item to PR draft
  const handleAddPrDraftItem = () => {
    if (!newPrItemCode.trim() || !newPrItemName.trim()) {
      showToast('Please enter both Item Code and Description.');
      return;
    }
    const qty = parseInt(newPrItemQty, 10) || 1000;
    const rate = parseFloat(newPrItemRate) || 40.0;
    const newItem: ConsolidatedPlanItem = {
      id: `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      planId: selectedSalesPrUnit?.unitPlanId || 'PLN-DRAFT',
      monthPeriod: selectedSalesPrUnit?.monthPeriod || 'September 2026',
      customer: newPrItemCustomer || 'Tata Motors Passenger Vehicles Ltd',
      customerGstin: '27AAACT2727Q1ZW',
      plant: selectedSalesPrUnit?.plantName || 'Plant 1 - Pimpri Auto-Hub',
      fgStore: newPrItemStore || 'FG-Automotive Cell',
      itemCode: newPrItemCode.trim().toUpperCase(),
      itemName: newPrItemName.trim(),
      hsn: '39269099',
      plannedQty: qty,
      deliveredQty: 0,
      invoicedQty: 0,
      remainingQty: qty,
      rate,
      totalValue: qty * rate,
      uom: 'PCS',
      status: 'Pending Supply',
    };
    setPrDraftItems((prev) => [newItem, ...prev]);
    setIsAddPrItemModalOpen(false);
    setNewPrItemCode('');
    setNewPrItemName('');
    showToast(`✓ Added ${newItem.itemCode} to Purchase Requisition draft.`);
  };

  // In-grid + Order action from inside Raise PR modal
  const handleCreateOrderFromPrLine = (item: ConsolidatedPlanItem) => {
    showToast(`Opening Sales Order creation wizard for SKU ${item.itemCode}...`);
    setIsSalesPrModalOpen(false);
    onNavigate('soWizard', {
      linkedPlanId: selectedSalesPrUnit?.unitPlanId || item.planId,
      monthPeriod: item.monthPeriod,
      customer: item.customer,
      plant: item.plant,
      itemCode: item.itemCode,
      itemName: item.itemName,
      plannedQty: item.plannedQty,
      rate: item.rate,
      defaultOrderType: 'Daily Sales Order',
    });
  };

  // Submit Unit PR to Procurement
  const handleSubmitUnitPr = () => {
    if (!selectedSalesPrUnit || prDraftItems.length === 0) {
      showToast('No items to submit in this Purchase Requisition.');
      return;
    }

    const unitSuffix = selectedSalesPrUnit.unitPlanId.split('-').pop() || 'U1';
    const prNumber = `PR-2026-09-${unitSuffix}-${Math.floor(100 + Math.random() * 900)}`;
    const totalQty = prDraftItems.reduce((s, it) => s + it.plannedQty, 0);
    const totalVal = prDraftItems.reduce((s, it) => s + it.totalValue, 0);

    const newPR: PurchaseRequisition = {
      id: prNumber,
      prNumber: prNumber,
      requestDate: new Date().toISOString().slice(0, 10),
      requestedBy: `Supply Planning (${selectedSalesPrUnit.plantName})`,
      department: 'Store & Procurement',
      plantWarehouse: selectedSalesPrUnit.plantName,
      requiredDate: newPrItemDate || new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      priority: 'High',
      source: 'Monthly Plan Order',
      currency: 'INR (₹)',
      estimatedTotal: totalVal,
      budgetAllocated: Math.round(totalVal * 1.2),
      budgetRemaining: Math.round(totalVal * 0.2),
      budgetExceeded: false,
      status: 'pending_approval',
      approvalStatus: 'pending',
      currentApprover: 'K. Ramanathan (Procurement VP)',
      justification: `Unit monthly demand call-off requisition for ${selectedSalesPrUnit.unitPlanId} (${selectedSalesPrUnit.monthPeriod}) at ${selectedSalesPrUnit.plantName}.`,
      notes: `Dedicated Unit Requisition with ${prDraftItems.length} finished goods commitment lines. Planned output: ${totalQty.toLocaleString()} PCS.`,
      lines: prDraftItems.map((it, idx) => ({
        id: `PRL-${unitSuffix}-${idx + 1}`,
        lineNo: idx + 1,
        itemCode: it.itemCode,
        itemName: it.itemName,
        itemCategory: 'Finished Goods Demand',
        description: `Committed monthly demand for ${it.customer} (${it.fgStore})`,
        quantity: it.plannedQty,
        uom: it.uom || 'PCS',
        requiredDate: newPrItemDate || new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
        suggestedSupplierId: 'SUP-S0128',
        suggestedSupplierName: 'RELIANCE INDUSTRIES LIMITED',
        estimatedUnitPrice: it.rate,
        estimatedTotal: it.totalValue,
        salesOrderRef: selectedSalesPrUnit.unitPlanId,
        status: 'pending',
      })),
      approvalHistory: [
        {
          step: 1,
          role: 'Plant Demand Planner',
          user: `Planner (${selectedSalesPrUnit.plantName})`,
          action: 'Approved',
          date: new Date().toISOString().slice(0, 10),
          comment: `Requisition submitted from Unit Plan ${selectedSalesPrUnit.unitPlanId}`,
        },
      ],
    };

    addPurchaseRequisition(newPR);
    adminEventBus.emit('PR_SAVED', newPR);
    adminEventBus.emit('PR_CREATED', newPR);
    adminEventBus.emit('PR_SUBMITTED_FOR_APPROVAL', newPR);

    setIsSalesPrModalOpen(false);
    showToast(`✓ Purchase Requisition ${prNumber} created for ${selectedSalesPrUnit.plantName} and submitted to Procurement!`);
  };

  // Filtered & Paginated items for the Raise PR workbench modal (Scalable to 10,000+ items)
  const filteredPrDraftItems = useMemo(() => {
    return prDraftItems.filter((item) => {
      if (prCustomerFilter !== 'All' && item.customer !== prCustomerFilter) return false;
      if (prSearchQuery) {
        const q = prSearchQuery.toLowerCase().trim();
        const matchCode = (item.itemCode || '').toLowerCase().includes(q);
        const matchName = (item.itemName || '').toLowerCase().includes(q);
        const matchCust = (item.customer || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCust) return false;
      }
      return true;
    });
  }, [prDraftItems, prCustomerFilter, prSearchQuery]);

  const totalPrDraftPages = Math.ceil(filteredPrDraftItems.length / prPageSize) || 1;
  const paginatedPrDraftItems = useMemo(() => {
    const start = (prPage - 1) * prPageSize;
    return filteredPrDraftItems.slice(start, start + prPageSize);
  }, [filteredPrDraftItems, prPage, prPageSize]);

  const prTotalDemandQty = useMemo(() => {
    return prDraftItems.reduce((s, it) => s + (Number(it.plannedQty) || 0), 0);
  }, [prDraftItems]);

  const prTotalEstimatedValue = useMemo(() => {
    return prDraftItems.reduce((s, it) => s + ((Number(it.plannedQty) || 0) * (Number(it.rate) || 0)), 0);
  }, [prDraftItems]);

  const prEstimatedPolymerKg = Math.round(prTotalDemandQty * 0.45);

  // Confirm Duplicating Month Plan to Next Month
  const handleExecutePlanDuplication = (shareDirectlyToPurchase: boolean = false) => {
    if (!duplicateSourceMonth) return;

    const computedMonthPeriod = `${dupSelectedMonth} ${dupSelectedYear}`;

    // Group items by customer & plant to create child plan records for next month
    const groups: Record<string, typeof dupItems> = {};
    dupItems.forEach((item) => {
      const key = `${item.customer}__${item.plant}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const monthsMap: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
    };
    const mCode = monthsMap[dupSelectedMonth.toLowerCase()] || '10';

    const newCreatedPlans: MonthlyPlanOrder[] = [];
    let counter = 1;

    Object.entries(groups).forEach(([key, itemsList]) => {
      const first = itemsList[0];
      const planId = `PLN-${dupSelectedYear}-${mCode}-${String(counter).padStart(2, '0')}`;
      counter++;

      const totalPlanned = itemsList.reduce((sum, it) => sum + (Number(it.newPlannedQty) || 0), 0);
      const totalVal = itemsList.reduce((sum, it) => sum + ((Number(it.newPlannedQty) || 0) * (Number(it.rate) || 0)), 0);

      const newPlan: MonthlyPlanOrder = {
        id: planId,
        customer: first.customer,
        customerGstin: first.customerGstin || '27AAACG0943A1ZX',
        monthPeriod: computedMonthPeriod,
        planType: 'Monthly supply plan',
        consumptionMode: 'Manual reconciliation',
        billingMode: 'Reconciliation only',
        status: 'Published',
        plant: first.plant,
        fgStore: first.fgStore || 'FG-Automotive Cell',
        createdDate: new Date().toISOString().slice(0, 10),
        items: itemsList.map((it) => ({
          itemCode: it.itemCode,
          itemName: it.itemName,
          hsn: '39269099',
          plannedQty: Number(it.newPlannedQty) || 0,
          deliveredQty: 0,
          invoicedQty: 0,
          remainingQty: Number(it.newPlannedQty) || 0,
          rate: Number(it.rate) || 0,
          uom: it.uom || 'PCS',
          plant: it.plant,
          fgStore: it.fgStore || 'FG-Automotive Cell',
        })),
        totalPlannedQty: totalPlanned,
        totalDailySuppliedQty: 0,
        remainingPlanQty: totalPlanned,
        varianceQty: -totalPlanned,
        variancePct: -100,
        totalPlannedValue: totalVal,
        notes: dupNotes,
        auditTrail: [
          {
            action: `Duplicated from ${duplicateSourceMonth.planId} (${duplicateSourceMonth.monthPeriod})`,
            user: 'Sales Operations Manager',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            note: `Monthly forecast rolled over to ${computedMonthPeriod} (Total ${totalPlanned.toLocaleString()} PCS)`,
          },
        ],
      };

      newCreatedPlans.push(newPlan);
      if (onCreatePlan) onCreatePlan(newPlan);
    });

    setPlans((prev) => [...newCreatedPlans, ...prev]);

    // If "Share to Purchase" was clicked, automatically generate Purchase Requisition
    if (shareDirectlyToPurchase) {
      const prNumber = `PR-2026-${Math.floor(100 + Math.random() * 900)}`;
      const totalPlasticPieces = dupTotalPlannedQty;
      const estimatedRawResinKg = Math.round(totalPlasticPieces * 0.45);
      const estimatedMasterbatchKg = Math.round(estimatedRawResinKg * 0.02);

      const newPR: PurchaseRequisition = {
        id: prNumber,
        prNumber: prNumber,
        requestDate: new Date().toISOString().slice(0, 10),
        requestedBy: 'Consolidated Monthly Demand Engine (Rolled Forward Plan)',
        department: 'Store & Procurement',
        plantWarehouse: 'Plant 1 Central Store',
        requiredDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        priority: 'High',
        source: 'Monthly Plan Order',
        currency: 'INR (₹)',
        estimatedTotal: estimatedRawResinKg * 88.5 + estimatedMasterbatchKg * 340,
        budgetAllocated: 3800000,
        budgetRemaining: 2100000,
        budgetExceeded: false,
        status: 'pending_approval',
        approvalStatus: 'pending',
        currentApprover: 'K. Ramanathan (Procurement VP)',
        justification: `Automated polymer resin purchase requisition rolled forward for ${computedMonthPeriod} (${newCreatedPlans.length} customer commitments).`,
        notes: `Direct MRP calculation for ${dupItems.length} planned items. Planned plastic output: ${totalPlasticPieces.toLocaleString()} PCS.`,
        lines: [
          {
            id: `PRL-${Math.floor(100 + Math.random() * 900)}`,
            lineNo: 1,
            itemCode: 'RM-PP-NAT-001',
            itemName: 'Polypropylene Injection Grade Virgin Resin H110MA',
            itemCategory: 'Polymer Granules',
            description: `Virgin raw resin for ${computedMonthPeriod} demand commitments`,
            quantity: estimatedRawResinKg,
            uom: 'KG',
            requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
            suggestedSupplierId: 'SUP-S0128',
            suggestedSupplierName: 'RELIANCE INDUSTRIES LIMITED',
            estimatedUnitPrice: 88.5,
            estimatedTotal: estimatedRawResinKg * 88.5,
            salesOrderRef: `PLN-${dupSelectedYear}-${mCode}`,
            status: 'pending',
          },
          {
            id: `PRL-${Math.floor(100 + Math.random() * 900)}`,
            lineNo: 2,
            itemCode: 'MB-BLK-002',
            itemName: 'Carbon Black Masterbatch 40% Concentration',
            itemCategory: 'Color Masterbatch',
            description: 'High-dispersion black colorant for automotive trim and consumer parts',
            quantity: estimatedMasterbatchKg,
            uom: 'KG',
            requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
            suggestedSupplierId: 'SUP-S0045',
            suggestedSupplierName: 'CLARIANT COLORANTS CHEMICALS INDIA',
            estimatedUnitPrice: 340.0,
            estimatedTotal: estimatedMasterbatchKg * 340.0,
            salesOrderRef: `PLN-${dupSelectedYear}-${mCode}`,
            status: 'pending',
          },
        ],
        approvalHistory: [
          {
            step: 1,
            role: 'SCM Demand Planner',
            user: 'Sales Operations (Rollover)',
            action: 'Approved',
            date: new Date().toISOString().slice(0, 10),
            comment: `Generated from Duplicated Monthly Plan for ${computedMonthPeriod}`,
          },
          {
            step: 2,
            role: 'Purchase Manager',
            user: 'Purchase Manager (You)',
            action: 'Pending',
            comment: 'Pending rate validation in Enterprise Approvals Hub',
          },
        ],
      };

      addPurchaseRequisition(newPR);
      adminEventBus.emit('PR_SAVED', newPR);
      adminEventBus.emit('PR_CREATED', newPR);
      adminEventBus.emit('PR_SUBMITTED_FOR_APPROVAL', newPR);

      showToast(`✓ Master Plan for ${computedMonthPeriod} created & shared directly to Purchase Team! Generated PR ${prNumber} (${estimatedRawResinKg.toLocaleString()} KG Resin).`);
    } else {
      showToast(`✓ Master Monthly Plan for ${computedMonthPeriod} duplicated and confirmed successfully!`);
    }

    setIsDuplicating(false);
    setSelectedMonthKey(computedMonthPeriod);
  };

  // Centralized "Move Monthly Plan to Purchase Team" Action from standard views
  const handleCentralizedSendToPurchase = (monthPlan: MonthMasterPlan, itemsToConvert?: ConsolidatedPlanItem[]) => {
    const targetItems = itemsToConvert && itemsToConvert.length > 0 ? itemsToConvert : monthPlan.items;
    if (targetItems.length === 0) {
      showToast('No items selected to send to Purchase.');
      return;
    }

    const prNumber = `PR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const totalPlasticPieces = targetItems.reduce((sum, it) => sum + (it.plannedQty || 0), 0);
    const estimatedRawResinKg = Math.round(totalPlasticPieces * 0.45);
    const estimatedMasterbatchKg = Math.round(estimatedRawResinKg * 0.02);

    const newPR: PurchaseRequisition = {
      id: prNumber,
      prNumber: prNumber,
      requestDate: new Date().toISOString().slice(0, 10),
      requestedBy: 'Consolidated Sales Monthly Plan Engine (MRP)',
      department: 'Store & Procurement',
      plantWarehouse: `${monthPlan.plants[0]?.split(' - ')[0] || 'Plant 1'} Central Store`,
      requiredDate: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
      priority: 'High',
      source: 'Monthly Plan Order',
      currency: 'INR (₹)',
      estimatedTotal: estimatedRawResinKg * 88.5 + estimatedMasterbatchKg * 340,
      budgetAllocated: 3500000,
      budgetRemaining: 1850000,
      budgetExceeded: false,
      status: 'pending_approval',
      approvalStatus: 'pending',
      currentApprover: 'K. Ramanathan (Procurement VP)',
      justification: `Centralized automated raw polymer requirement generated for Master Monthly Sales Plan ${monthPlan.planId} (${monthPlan.monthPeriod}).`,
      notes: `Consolidated requirements for ${targetItems.length} planned SKUs across ${monthPlan.customers.join(', ')}. Planned plastic output: ${totalPlasticPieces.toLocaleString()} PCS.`,
      lines: [
        {
          id: `PRL-${Math.floor(100 + Math.random() * 900)}`,
          lineNo: 1,
          itemCode: 'RM-PP-NAT-001',
          itemName: 'Polypropylene Injection Grade Virgin Resin H110MA',
          itemCategory: 'Polymer Granules',
          description: `Virgin raw resin for ${monthPlan.monthPeriod} consolidated sales commitment`,
          quantity: estimatedRawResinKg,
          uom: 'KG',
          requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
          suggestedSupplierId: 'SUP-S0128',
          suggestedSupplierName: 'RELIANCE INDUSTRIES LIMITED',
          estimatedUnitPrice: 88.5,
          estimatedTotal: estimatedRawResinKg * 88.5,
          salesOrderRef: monthPlan.planId,
          status: 'pending',
        },
        {
          id: `PRL-${Math.floor(100 + Math.random() * 900)}`,
          lineNo: 2,
          itemCode: 'MB-BLK-002',
          itemName: 'Carbon Black Masterbatch 40% Concentration',
          itemCategory: 'Color Masterbatch',
          description: 'High-dispersion black colorant for automotive trim and consumer parts',
          quantity: estimatedMasterbatchKg,
          uom: 'KG',
          requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
          suggestedSupplierId: 'SUP-S0045',
          suggestedSupplierName: 'CLARIANT COLORANTS CHEMICALS INDIA',
          estimatedUnitPrice: 340.0,
          estimatedTotal: estimatedMasterbatchKg * 340.0,
          salesOrderRef: monthPlan.planId,
          status: 'pending',
        },
      ],
      approvalHistory: [
        {
          step: 1,
          role: 'SCM Demand Planner',
          user: 'Sales & Operations Consensus',
          action: 'Approved',
          date: new Date().toISOString().slice(0, 10),
          comment: `Rollup from Consolidated Master Monthly Plan ${monthPlan.planId} (${monthPlan.monthPeriod})`,
        },
        {
          step: 2,
          role: 'Purchase Manager',
          user: 'Purchase Manager (You)',
          action: 'Pending',
          comment: 'Pending commercial rate validation in Enterprise Approvals Hub',
        },
      ],
    };

    addPurchaseRequisition(newPR);
    adminEventBus.emit('PR_SAVED', newPR);
    adminEventBus.emit('PR_CREATED', newPR);
    adminEventBus.emit('PR_SUBMITTED_FOR_APPROVAL', newPR);

    showToast(`✓ Monthly Plan ${monthPlan.planId} sent to Purchase Module! Generated PR ${prNumber} (${estimatedRawResinKg.toLocaleString()} KG Polymer Resin).`);
  };

  // Toggle Single Item Selection
  const toggleSelectItem = (itemId: string) => {
    setSelectedItemIds((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Select / Deselect All Items on current page
  const handleSelectAllPageItems = (checked: boolean) => {
    const updated = { ...selectedItemIds };
    paginatedMonthItems.forEach((it) => {
      updated[it.id] = checked;
    });
    setSelectedItemIds(updated);
  };

  const isAllPageSelected =
    paginatedMonthItems.length > 0 &&
    paginatedMonthItems.every((it) => selectedItemIds[it.id]);

  const selectedItemsCount = Object.values(selectedItemIds).filter(Boolean).length;

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const yearOptions = ['2026', '2027', '2028'];

  // -------------------------------------------------------------
  // RENDER: Dedicated Duplication Full-Page Workbench (10,000+ Items Scalable)
  // -------------------------------------------------------------
  if (isDuplicating && duplicateSourceMonth) {
    const distinctCustomers = Array.from(new Set(dupItems.map((i) => i.customer)));
    const distinctPlants = Array.from(new Set(dupItems.map((i) => i.plant)));

    return (
      <div className="space-y-5 animate-fade-in text-xs">
        {/* Top Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDuplicating(false)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Cancel and return to Monthly Plans"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Plans</span>
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#14213D] text-white rounded-lg">
                  <Copy className="w-4 h-4" />
                </span>
                <h1 className="text-base font-bold text-slate-900">
                  Duplicate Monthly Plan Workbench &bull; Roll Forward {duplicateSourceMonth.planId}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {dupItems.length} Planned SKUs
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Freely adjust new monthly planned quantities. Unit rates are governed strictly by the Central Price Master.
              </p>
            </div>
          </div>

          {/* Action Buttons: Confirm & Create or Share Directly to Purchase */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDuplicating(false)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleExecutePlanDuplication(false)}
              className="px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Confirm &amp; Create Plan</span>
            </button>
            <button
              onClick={() => handleExecutePlanDuplication(true)}
              className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
              title="Create new plan and immediately generate raw polymer Purchase Requisition in Procurement"
            >
              <Send className="w-4 h-4" />
              <span>Confirm &amp; Share to Purchase</span>
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                ~{dupEstimatedPolymerKg.toLocaleString()} KG
              </span>
            </button>
          </div>
        </div>

        {/* Month Calendar Selector & Period Controls (Enrolled Customer removed per requirement) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Month Calendar / Period Picker */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0F8B8D]" />
                <span className="font-bold text-slate-900 text-xs">Target Plan Month Period:</span>
              </div>

              {/* Month Selector */}
              <select
                value={dupSelectedMonth}
                onChange={(e) => setDupSelectedMonth(e.target.value)}
                className="border border-indigo-300 rounded-lg px-3 py-1.5 bg-indigo-50/50 text-indigo-950 font-bold focus:ring-1 focus:ring-indigo-500 text-xs"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={dupSelectedYear}
                onChange={(e) => setDupSelectedYear(e.target.value)}
                className="border border-indigo-300 rounded-lg px-3 py-1.5 bg-indigo-50/50 text-indigo-950 font-bold focus:ring-1 focus:ring-indigo-500 text-xs"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                Roll forward from: <b>{duplicateSourceMonth.monthPeriod}</b>
              </span>
            </div>

            {/* Price Master Notice & Quick Link */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg text-amber-900 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Unit Prices are locked to Price Master.</span>
              <button
                onClick={() => onNavigate('pricingMatrix')}
                className="text-[#0F8B8D] font-bold hover:underline flex items-center gap-0.5 ml-1"
              >
                <span>Open Price Master</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* KPI Tally Summary for Roll-forward */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Prev Dispatched Qty</div>
              <div className="text-base font-bold text-emerald-700 mt-0.5">
                {duplicateSourceMonth.totalDispatchedQty.toLocaleString()} PCS
              </div>
              <div className="text-[10px] text-slate-400">Actual deliveries</div>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200">
              <div className="text-[10px] uppercase font-bold text-blue-800">New Planned Commitment</div>
              <div className="text-base font-bold text-blue-900 mt-0.5">
                {dupTotalPlannedQty.toLocaleString()} PCS
              </div>
              <div className="text-[10px] text-blue-700">Editable for {dupSelectedMonth} {dupSelectedYear}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Commitment Value</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                ₹{(dupTotalPlannedValue / 100000).toFixed(2)} Lakhs
              </div>
              <div className="text-[10px] text-slate-400">Master unit price total</div>
            </div>

            <div className="bg-cyan-50/50 p-3 rounded-lg border border-cyan-200">
              <div className="text-[10px] uppercase font-bold text-cyan-800">Raw Polymer Requirement</div>
              <div className="text-base font-bold text-cyan-900 mt-0.5">
                {dupEstimatedPolymerKg.toLocaleString()} KG
              </div>
              <div className="text-[10px] text-cyan-700">MRP BOM rollup for Purchase</div>
            </div>
          </div>
        </div>

        {/* Scalable Items Grid Toolbar: Search, Filters & Bulk Operations */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search SKU code, description, customer..."
                value={dupSearchQuery}
                onChange={(e) => {
                  setDupSearchQuery(e.target.value);
                  setDupPage(1);
                }}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] text-xs w-64"
              />
            </div>

            {/* Customer Filter */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-semibold text-[11px]">Customer:</span>
              <select
                value={dupCustomerFilter}
                onChange={(e) => {
                  setDupCustomerFilter(e.target.value);
                  setDupPage(1);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-xs text-slate-700 max-w-[180px] truncate"
              >
                <option value="All">All Customers ({distinctCustomers.length})</option>
                {distinctCustomers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Plant Filter */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-semibold text-[11px]">Plant:</span>
              <select
                value={dupPlantFilter}
                onChange={(e) => {
                  setDupPlantFilter(e.target.value);
                  setDupPage(1);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-xs text-slate-700"
              >
                <option value="All">All Plants ({distinctPlants.length})</option>
                {distinctPlants.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Bulk Tuning Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Quick Adjust:</span>
            <button
              onClick={() => handleApplyGrowthPercentage(5)}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
              title="Add 5% growth to all planned quantities"
            >
              +5% Forecast
            </button>
            <button
              onClick={() => handleApplyGrowthPercentage(10)}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
              title="Add 10% growth to all planned quantities"
            >
              +10% Forecast
            </button>

            {/* Task-2: Custom % Input Box Option */}
            <div className="flex items-center gap-1 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-300">
              <span className="text-[10px] font-semibold text-slate-500">Custom:</span>
              <input
                type="number"
                step="0.5"
                placeholder="2"
                value={customAdjustmentPct}
                onChange={(e) => setCustomAdjustmentPct(e.target.value)}
                className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                title="Enter custom percentage value to adjust (e.g. 2 for 2%)"
              />
              <span className="text-[11px] font-bold text-slate-600">%</span>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(customAdjustmentPct);
                  if (!isNaN(val)) {
                    handleApplyGrowthPercentage(val);
                  } else {
                    handleApplyGrowthPercentage(2);
                  }
                }}
                className="px-2 py-0.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded text-[11px] font-bold transition shadow-2xs cursor-pointer"
                title={`Adjust all planned quantities by ${customAdjustmentPct || 2}%`}
              >
                Adjust
              </button>
            </div>

            <button
              onClick={handleCopyPrevDispatchedAll}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
              title="Set new planned quantities to previous month dispatched amounts"
            >
              Match Actuals
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <span className="text-[11px] text-gray-500">Rows:</span>
            <select
              value={dupPageSize}
              onChange={(e) => {
                setDupPageSize(Number(e.target.value));
                setDupPage(1);
              }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Dedicated Editable Duplication Table Grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3">Item Code &amp; Description</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Plant &amp; Location</th>
                  <th className="p-3 text-right">Prev Planned</th>
                  <th className="p-3 text-right">Prev Dispatched</th>
                  <th className="p-3 text-right w-36">New Planned (PCS) *</th>
                  <th className="p-3 text-right">Master Rate (₹)</th>
                  <th className="p-3 text-right">Commitment Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedDupItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No line items matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedDupItems.map((item) => {
                    const lineVal = (Number(item.newPlannedQty) || 0) * (Number(item.rate) || 0);

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-slate-900">{item.itemCode}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{item.itemName}</div>
                        </td>
                        <td className="p-3 font-semibold text-gray-900">
                          <div>{item.customer}</div>
                          <div className="text-[10px] text-gray-400 font-mono font-normal">
                            GSTIN: {item.customerGstin}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div className="flex items-center gap-1 font-medium text-slate-800">
                            <Factory className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.plant}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{item.fgStore}</div>
                        </td>
                        <td className="p-3 text-right font-medium text-slate-600">
                          {item.prevPlannedQty.toLocaleString()} {item.uom}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-700">
                          {item.prevDispatchedQty.toLocaleString()} {item.uom}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.newPlannedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setDupItems((prev) =>
                                prev.map((it) => (it.id === item.id ? { ...it, newPlannedQty: val } : it))
                              );
                            }}
                            className="w-32 border border-indigo-300 rounded-lg p-1.5 text-right font-bold text-blue-950 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-right font-mono">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold" title="Master Unit Price locked to Central Price Master">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>₹{item.rate.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">
                          ₹{(lineVal / 100000).toFixed(2)}L
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Duplication Grid Pagination Controls */}
          <div className="p-3.5 border-t border-gray-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <b>{filteredDupItems.length === 0 ? 0 : (dupPage - 1) * dupPageSize + 1}</b> to{' '}
              <b>{Math.min(dupPage * dupPageSize, filteredDupItems.length)}</b> of{' '}
              <b>{filteredDupItems.length}</b> line item records
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={dupPage <= 1}
                onClick={() => setDupPage(1)}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={dupPage <= 1}
                onClick={() => setDupPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-slate-800">
                Page {dupPage} of {totalDupPages}
              </span>
              <button
                disabled={dupPage >= totalDupPages}
                onClick={() => setDupPage((p) => Math.min(p + 1, totalDupPages))}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={dupPage >= totalDupPages}
                onClick={() => setDupPage(totalDupPages)}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Commitment Notes */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <label className="block font-bold text-slate-700">Monthly Plan Notes &amp; Consensus Rules</label>
          <textarea
            rows={2}
            value={dupNotes}
            onChange={(e) => setDupNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-xs"
            placeholder="Enter consensus notes, forecast assumptions, or supply constraints..."
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Standard Views (Master Grid & Detailed Month Grid)
  // -------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* View Mode 1: Detailed Items Page Grid for a Selected Month Period */}
      {currentSelectedMonthPlan ? (
        <div className="space-y-5 animate-fade-in">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMonthKey(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Return to Master Monthly Plans Grid"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Monthly Plans</span>
              </button>
              <div className="h-5 w-px bg-slate-200 hidden sm:block" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#0F8B8D]">
                    {currentSelectedMonthPlan.planId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    &bull; {currentSelectedMonthPlan.monthPeriod} Detailed Sales Commitments
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentSelectedMonthPlan.items.length} Planned SKUs
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Plant-wise item sales forecast, dispatched tally, and centralized procurement conversion.
                </p>
              </div>
            </div>

            {/* Centralized Action Buttons in Detailed View */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => handleOpenDuplicateWorkbench(currentSelectedMonthPlan, e)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                title="Open dedicated full-screen workbench to duplicate this month plan to next month"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate to Next Month</span>
              </button>

              {/* Centralized Button: Move Monthly Plan to Purchase Team */}
              <button
                onClick={() => {
                  const selectedList = currentSelectedMonthPlan.items.filter((it) => selectedItemIds[it.id]);
                  handleCentralizedSendToPurchase(
                    currentSelectedMonthPlan,
                    selectedList.length > 0 ? selectedList : currentSelectedMonthPlan.items
                  );
                }}
                className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                title="Calculate BOM raw material resin requirements and create Purchase Requisition in Procurement module"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {selectedItemsCount > 0
                    ? `Send ${selectedItemsCount} Selected to Purchase Team`
                    : 'Send Monthly Plan to Purchase Team'}
                </span>
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  ~{Math.round(currentSelectedMonthPlan.totalPlannedQty * 0.45).toLocaleString()} KG Resin
                </span>
              </button>
            </div>
          </div>

          {/* Month Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Plan Period</div>
              <div className="text-base font-bold text-slate-900 mt-1">{currentSelectedMonthPlan.monthPeriod}</div>
              <div className="text-[10px] text-indigo-600 mt-0.5">{currentSelectedMonthPlan.customers.length} Customers Enrolled</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Qty</div>
              <div className="text-lg font-bold text-blue-700 mt-1">
                {currentSelectedMonthPlan.totalPlannedQty.toLocaleString()} <span className="text-xs text-gray-500 font-normal">PCS</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{currentSelectedMonthPlan.items.length} Product Lines</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Dispatched</div>
              <div className="text-lg font-bold text-emerald-700 mt-1">
                {currentSelectedMonthPlan.totalDispatchedQty.toLocaleString()} <span className="text-xs text-gray-500 font-normal">PCS</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Delivered via Daily SOs</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Pending Balance Tally</div>
              <div className="text-lg font-bold text-amber-700 mt-1">
                {currentSelectedMonthPlan.pendingBalanceQty.toLocaleString()} <span className="text-xs text-gray-500 font-normal">PCS</span>
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">Planned &minus; Dispatched</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Value</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                ₹{(currentSelectedMonthPlan.totalPlannedValue / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Monthly Commitment</div>
            </div>
          </div>

          {/* Task-2: Plant-wise Unit Sub-Plans Grid (Each unit has unique Unit Plan ID e.g. PLN-2026-09-U1) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
            <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-[#0F8B8D]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Manufacturing Plants &amp; Unique Unit Plan Breakdown ({currentSelectedMonthPlan.plantUnits?.length || 0} Units)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Unique Unit Plan IDs for isolated requisitioning &amp; production dispatch
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Unit Plan ID</th>
                    <th className="py-2.5 px-3">Manufacturing Plant</th>
                    <th className="py-2.5 px-3">Enrolled Customers</th>
                    <th className="py-2.5 px-3 text-right">Planned Qty</th>
                    <th className="py-2.5 px-3 text-right">Dispatched</th>
                    <th className="py-2.5 px-3 text-right">Balance (Tally)</th>
                    <th className="py-2.5 px-3 text-right">Plan Value</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Unit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(currentSelectedMonthPlan.plantUnits || []).map((unit) => (
                    <tr key={unit.unitPlanId} className="hover:bg-teal-50/30 transition-colors">
                      {/* Unit Plan ID */}
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold inline-flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#0F8B8D]" />
                          {unit.unitPlanId}
                        </span>
                      </td>

                      {/* Plant Name */}
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{unit.plantName}</span>
                        </div>
                      </td>

                      {/* Customers */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="truncate max-w-[200px]" title={unit.customers.join(', ')}>
                          {unit.customers.join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {unit.totalItemsCount} Planned Product Lines
                        </div>
                      </td>

                      {/* Planned Qty */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {unit.totalPlannedQty.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">PCS</span>
                      </td>

                      {/* Dispatched */}
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {unit.totalDispatchedQty.toLocaleString()}
                      </td>

                      {/* Balance (Tally) */}
                      <td className="py-3 px-3 text-right font-bold font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold inline-block ${
                            unit.pendingBalanceQty <= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {unit.pendingBalanceQty.toLocaleString()} PCS
                        </span>
                      </td>

                      {/* Plan Value */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ₹{(unit.totalPlannedValue / 100000).toFixed(2)}L
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            unit.status === 'Fully Supplied'
                              ? 'bg-emerald-100 text-emerald-800'
                              : unit.status === 'Partially Supplied'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {unit.status}
                        </span>
                      </td>

                      {/* Unit Actions: Raise PR & Create Order */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Task-2 & Task-4: Raise PR for this specific unit */}
                          <button
                            onClick={(e) => handleOpenRaisePrForUnit(unit, e)}
                            className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title={`Raise Purchase Requisition for ${unit.plantName} (${unit.unitPlanId})`}
                          >
                            <Send className="w-3 h-3" />
                            <span>Raise PR</span>
                          </button>

                          {/* + Order button for unit */}
                          <button
                            onClick={() => {
                              onNavigate('soWizard', {
                                linkedPlanId: unit.unitPlanId,
                                monthPeriod: unit.monthPeriod,
                                customer: unit.customers[0],
                                plant: unit.plantName,
                                defaultOrderType: 'Daily Sales Order',
                              });
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            title={`Create Order linked to ${unit.unitPlanId}`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Order</span>
                          </button>

                          {/* Quick filter SKUs */}
                          <button
                            onClick={() => {
                              setItemPlantFilter(unit.plantName);
                              setItemPage(1);
                              showToast(`Filtered lines for ${unit.plantName}`);
                            }}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition cursor-pointer"
                            title="Filter SKU lines below for this plant"
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Filter & Search Bar for Month Items Grid */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search item code, description, customer..."
                  value={itemSearchQuery}
                  onChange={(e) => {
                    setItemSearchQuery(e.target.value);
                    setItemPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] text-xs w-64"
                />
              </div>

              {/* Plant Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-semibold text-[11px]">Plant:</span>
                <select
                  value={itemPlantFilter}
                  onChange={(e) => {
                    setItemPlantFilter(e.target.value);
                    setItemPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-xs text-slate-700"
                >
                  <option value="All">All Plants</option>
                  {currentSelectedMonthPlan.plants.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Customer Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-semibold text-[11px]">Customer:</span>
                <select
                  value={itemCustomerFilter}
                  onChange={(e) => {
                    setItemCustomerFilter(e.target.value);
                    setItemPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-xs text-slate-700 max-w-[180px] truncate"
                >
                  <option value="All">All Customers</option>
                  {currentSelectedMonthPlan.customers.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500">Rows per page:</span>
              <select
                value={itemPageSize}
                onChange={(e) => {
                  setItemPageSize(Number(e.target.value));
                  setItemPage(1);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Month Detailed Items Table Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={(e) => handleSelectAllPageItems(e.target.checked)}
                        className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                      />
                    </th>
                    <th className="p-3">Item Code &amp; Description</th>
                    <th className="p-3">Target Customer</th>
                    <th className="p-3">Manufacturing Plant &amp; Store</th>
                    <th className="p-3 text-right">Planned Qty</th>
                    <th className="p-3 text-right">Dispatched Qty</th>
                    <th className="p-3 text-right">Invoiced Qty</th>
                    <th className="p-3 text-right font-bold text-amber-800">Pending Tally Balance</th>
                    <th className="p-3 text-right">Unit Rate (Master)</th>
                    <th className="p-3 text-right">Item Value</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedMonthItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400">
                        No sales planned line items found for this month matching filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedMonthItems.map((item) => {
                      const isSelected = Boolean(selectedItemIds[item.id]);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-blue-50/30 transition-colors ${
                            isSelected ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(item.id)}
                              className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                              <span>{item.itemCode}</span>
                              {item.customerItemCode && (
                                <span className="text-[10px] text-gray-400 font-normal">
                                  ({item.customerItemCode})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{item.itemName}</div>
                          </td>
                          <td className="p-3 font-semibold text-gray-900">
                            <div>{item.customer}</div>
                            <div className="text-[10px] text-gray-400 font-mono font-normal">
                              GSTIN: {item.customerGstin}
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">
                            <div className="flex items-center gap-1 font-medium text-slate-800">
                              <Factory className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.plant}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{item.fgStore}</div>
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            {item.plannedQty.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">{item.uom}</span>
                          </td>
                          <td className="p-3 text-right font-semibold text-emerald-700">
                            {item.deliveredQty.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-indigo-700 font-medium">
                            {item.invoicedQty.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                item.remainingQty <= 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {item.remainingQty.toLocaleString()} {item.uom}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                              <span>₹{item.rate.toFixed(2)}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            ₹{(item.totalValue / 100000).toFixed(2)}L
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'Fully Supplied'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'Partially Supplied'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Item Grid */}
            <div className="p-3 border-t border-gray-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                Showing <b>{filteredMonthItems.length === 0 ? 0 : (itemPage - 1) * itemPageSize + 1}</b> to{' '}
                <b>{Math.min(itemPage * itemPageSize, filteredMonthItems.length)}</b> of{' '}
                <b>{filteredMonthItems.length}</b> line item records
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={itemPage <= 1}
                  onClick={() => setItemPage(1)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={itemPage <= 1}
                  onClick={() => setItemPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-1 text-xs font-semibold text-slate-800">
                  Page {itemPage} of {totalItemPages}
                </span>
                <button
                  disabled={itemPage >= totalItemPages}
                  onClick={() => setItemPage((p) => Math.min(p + 1, totalItemPages))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={itemPage >= totalItemPages}
                  onClick={() => setItemPage(totalItemPages)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View Mode 2: Master Monthly Plan Grid (One Month Period = One Master Plan ID) */
        <div className="space-y-4">
          {/* Plant Scope Switcher: Autocomplete Dropdown Selector */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <Building2 className="w-4 h-4 text-[#0F8B8D]" /> Operational View Scope:
              </span>
              <div className="relative w-full max-w-md">
                <button
                  type="button"
                  onClick={() => setIsPlantScopeDropdownOpen(!isPlantScopeDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Factory className="w-3.5 h-3.5 text-[#0F8B8D] shrink-0" />
                    <span className="truncate">
                      {plantScopeOptions.find((o) => o.id === selectedPlantScope)?.label || 'All Manufacturing Plants'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isPlantScopeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPlantScopeDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search/autocomplete plant name..."
                        value={plantScopeSearch}
                        onChange={(e) => setPlantScopeSearch(e.target.value)}
                        autoFocus
                        className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-1">
                      {plantScopeOptions
                        .filter((opt) => opt.label.toLowerCase().includes(plantScopeSearch.toLowerCase()))
                        .map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => {
                              setSelectedPlantScope(opt.id);
                              setIsPlantScopeDropdownOpen(false);
                              setPlantScopeSearch('');
                              setMasterPage(1);
                            }}
                            className={`p-2 rounded-lg cursor-pointer transition flex items-center justify-between gap-2 ${
                              selectedPlantScope === opt.id
                                ? 'bg-[#14213D] text-white font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="truncate">{opt.label}</span>
                            {selectedPlantScope === opt.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('soWizard', { defaultOrderType: 'Monthly Plan Order' })}
                className="px-3.5 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Create Monthly Plan via 6-Step Sales Order Wizard"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Monthly Plan</span>
              </button>
              <button
                onClick={() => onNavigate('purchaseReqList')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>PR Register</span>
              </button>
            </div>
          </div>

          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-gray-500">Monthly Master Plans</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{filteredMasterPlans.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">One Plan ID Per Month</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Qty</div>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {filteredMasterPlans.reduce((s, p) => s + p.totalPlannedQty, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Committed Supply PCS</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Dispatched</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {filteredMasterPlans.reduce((s, p) => s + p.totalDispatchedQty, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Delivered via Daily SOs</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-gray-500">Pending Tally Balance</div>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {(
                  filteredMasterPlans.reduce((s, p) => s + p.totalPlannedQty, 0) -
                  filteredMasterPlans.reduce((s, p) => s + p.totalDispatchedQty, 0)
                ).toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">Planned &minus; Dispatched</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Value</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                ₹{(filteredMasterPlans.reduce((s, p) => s + p.totalPlannedValue, 0) / 100000).toFixed(1)}L
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Commitment total</div>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs text-xs">
            <div className="flex items-center gap-1 overflow-x-auto">
              {['All Plans', 'Partially Supplied', 'Fully Supplied', 'Active'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setMasterPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#14213D] text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search plan #, month, customer, SKU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setMasterPage(1);
                  }}
                  className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] w-60"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <span>Page size:</span>
                <select
                  value={masterPageSize}
                  onChange={(e) => {
                    setMasterPageSize(Number(e.target.value));
                    setMasterPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task-1: Master Monthly Plan Grid (Fitted 100% width with NO horizontal sliding bar) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden text-xs">
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3 w-[12%]">Plan ID</th>
                  <th className="py-3 px-2 w-[11%]">Month Period</th>
                  <th className="py-3 px-3 w-[22%]">Enrolled Customers &amp; SKUs</th>
                  <th className="py-3 px-2 w-[17%]">Manufacturing Plants</th>
                  <th className="py-3 px-2 text-right w-[9%]">Planned Qty</th>
                  <th className="py-3 px-2 text-right w-[8%]">Dispatched</th>
                  <th className="py-3 px-2 text-right w-[10%]">Balance (Tally)</th>
                  <th className="py-3 px-3 text-right w-[11%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMasterPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No monthly master plans found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedMasterPlans.map((mPlan) => {
                    const balanceQty = mPlan.pendingBalanceQty;

                    return (
                      <tr
                        key={mPlan.monthKey}
                        onClick={() => handleOpenMonthDetail(mPlan.monthKey)}
                        className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                      >
                        {/* Plan ID */}
                        <td className="py-3 px-3 font-mono font-bold text-[#0F8B8D]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-900 group-hover:text-[#0F8B8D] font-bold">
                              {mPlan.planId}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0F8B8D] transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </td>

                        {/* Month Period */}
                        <td className="py-3 px-2 font-semibold text-gray-900">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-[11px] inline-block">
                            {mPlan.monthPeriod}
                          </span>
                        </td>

                        {/* Customers & SKUs */}
                        <td className="py-3 px-3 text-gray-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                              {mPlan.customers[0] || 'Universal Automotive OEM'}
                            </span>
                            {mPlan.customers.length > 1 && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0"
                                title={mPlan.customers.join(', ')}
                              >
                                +{mPlan.customers.length - 1} more
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                            {mPlan.totalItemsCount} Planned SKU Line(s) &bull; ₹{((mPlan.totalPlannedValue || 0) / 100000).toFixed(1)}L
                          </div>
                        </td>

                        {/* Manufacturing Plants */}
                        <td className="py-3 px-2 text-gray-600">
                          <div className="flex items-center gap-1 font-medium text-slate-800">
                            <Factory className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{mPlan.plants[0] || 'Plant 1 - Pimpri Auto-Hub'}</span>
                            {mPlan.plants.length > 1 && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 shrink-0"
                                title={mPlan.plants.join(', ')}
                              >
                                +{mPlan.plants.length - 1}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Planned Qty */}
                        <td className="py-3 px-2 text-right font-bold text-gray-900">
                          {mPlan.totalPlannedQty.toLocaleString()} <span className="text-[9px] text-gray-500 font-normal">PCS</span>
                        </td>

                        {/* Dispatched Qty */}
                        <td className="py-3 px-2 text-right font-semibold text-emerald-700">
                          {mPlan.totalDispatchedQty.toLocaleString()}
                        </td>

                        {/* Pending Balance (Tally) */}
                        <td className="py-3 px-2 text-right font-bold font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold inline-block ${
                              balanceQty <= 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {balanceQty.toLocaleString()} PCS
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Task-2: Drill down into Plant-wise Unit Sub-Plans Grid */}
                            <button
                              onClick={() => handleOpenMonthDetail(mPlan.monthKey)}
                              className="px-2.5 py-1 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                              title="View Plant-wise Unit Plan Breakdown and Raise Unit PRs"
                            >
                              <span>Plant Units</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            {/* + Order linked to this master month */}
                            <button
                              onClick={() => {
                                onNavigate('soWizard', {
                                  linkedPlanId: mPlan.planId,
                                  monthPeriod: mPlan.monthPeriod,
                                  customer: mPlan.customers[0],
                                  plant: mPlan.plants[0] || 'Plant 1 - Pimpri Auto-Hub',
                                  defaultOrderType: 'Daily Sales Order',
                                });
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                              title="Create Sales Order linked to this Plan ID"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Order</span>
                            </button>

                            {/* Duplicate Plan */}
                            <button
                              onClick={(e) => handleOpenDuplicateWorkbench(mPlan, e)}
                              className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition cursor-pointer"
                              title="Duplicate plan to next month on dedicated workbench"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls for Master Grid */}
            <div className="p-3 border-t border-gray-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                Showing <b>{filteredMasterPlans.length === 0 ? 0 : (masterPage - 1) * masterPageSize + 1}</b> to{' '}
                <b>{Math.min(masterPage * masterPageSize, filteredMasterPlans.length)}</b> of{' '}
                <b>{filteredMasterPlans.length}</b> monthly master plans
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={masterPage <= 1}
                  onClick={() => setMasterPage(1)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={masterPage <= 1}
                  onClick={() => setMasterPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-1 text-xs font-semibold text-slate-800">
                  Page {masterPage} of {totalMasterPages}
                </span>
                <button
                  disabled={masterPage >= totalMasterPages}
                  onClick={() => setMasterPage((p) => Math.min(p + 1, totalMasterPages))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={masterPage >= totalMasterPages}
                  onClick={() => setMasterPage(totalMasterPages)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task-4: Redesigned Raise PR Workbench Modal with In-Grid CRUD & High Capacity 10,000+ Items Support */}
      {isSalesPrModalOpen && selectedSalesPrUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#14213D] to-[#0F8B8D] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Send className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight">
                      Raise Purchase Requisition &bull; Unit Demand Workbench
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/40 text-[10px] font-mono font-bold">
                      {selectedSalesPrUnit.unitPlanId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
                    <span>Manufacturing Unit: <b>{selectedSalesPrUnit.plantName}</b></span>
                    <span>&bull;</span>
                    <span>Month Period: <b>{selectedSalesPrUnit.monthPeriod}</b></span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSalesPrModalOpen(false);
                  setSelectedSalesPrUnit(null);
                }}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Top Summary KPIs */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Requisition Lines</span>
                <span className="text-base font-bold text-slate-900 mt-0.5">{prDraftItems.length} SKUs</span>
                <span className="text-[10px] text-slate-400 block">Editable in grid</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-blue-700 block uppercase font-bold">Total Demand Qty</span>
                <span className="text-base font-bold text-blue-900 mt-0.5">{prTotalDemandQty.toLocaleString()} PCS</span>
                <span className="text-[10px] text-blue-600 block">Committed output</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-cyan-700 block uppercase font-bold">Est. Raw Polymer</span>
                <span className="text-base font-bold text-cyan-900 mt-0.5">~{prEstimatedPolymerKg.toLocaleString()} KG</span>
                <span className="text-[10px] text-cyan-600 block">MRP formulation</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-[#0F8B8D] block uppercase font-bold">Est. Value (Master)</span>
                <span className="text-base font-bold text-[#0F8B8D] mt-0.5">₹{(prTotalEstimatedValue / 100000).toFixed(2)} Lakhs</span>
                <span className="text-[10px] text-slate-400 block">Read-only prices</span>
              </div>
            </div>

            {/* Modal Toolbar: Search, Customer Filter, and "+ Add SKU" Button */}
            <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search SKU code, description..."
                    value={prSearchQuery}
                    onChange={(e) => {
                      setPrSearchQuery(e.target.value);
                      setPrPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] text-xs w-60"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-semibold text-[11px]">Customer:</span>
                  <select
                    value={prCustomerFilter}
                    onChange={(e) => {
                      setPrCustomerFilter(e.target.value);
                      setPrPage(1);
                    }}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-xs text-slate-700 max-w-[160px] truncate"
                  >
                    <option value="All">All Customers</option>
                    {Array.from(new Set(prDraftItems.map((i) => i.customer))).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Task-4: Add New SKU Line Button */}
                <button
                  type="button"
                  onClick={() => setIsAddPrItemModalOpen(true)}
                  className="px-3 py-1.5 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Demand SKU</span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span>Rows:</span>
                  <select
                    value={prPageSize}
                    onChange={(e) => {
                      setPrPageSize(Number(e.target.value));
                      setPrPage(1);
                    }}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* In-Modal Add New SKU Form (Collapsible/Drawer) */}
            {isAddPrItemModalOpen && (
              <div className="p-3.5 bg-indigo-50/70 border-b border-indigo-200 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-indigo-950 text-xs flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-indigo-700" /> Add New SKU Demand Line to Purchase Requisition
                  </span>
                  <button
                    onClick={() => setIsAddPrItemModalOpen(false)}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Item Code</label>
                    <input
                      type="text"
                      placeholder="e.g. FG-AUTO-099"
                      value={newPrItemCode}
                      onChange={(e) => setNewPrItemCode(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Item Description</label>
                    <input
                      type="text"
                      placeholder="e.g. PP Center Console Bezel Bracket"
                      value={newPrItemName}
                      onChange={(e) => setNewPrItemName(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Planned Qty (PCS)</label>
                    <input
                      type="number"
                      min="1"
                      value={newPrItemQty}
                      onChange={(e) => setNewPrItemQty(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-bold text-right"
                    />
                  </div>
                  <div className="flex items-end gap-1">
                    <button
                      type="button"
                      onClick={handleAddPrDraftItem}
                      className="w-full py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded font-bold text-xs shadow-2xs transition cursor-pointer"
                    >
                      Add Line
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Table Grid: Full In-Grid CRUD & In-Grid + Order Button */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item Code &amp; Description</th>
                      <th className="py-2.5 px-3">Target Customer</th>
                      <th className="py-2.5 px-2">Receiving FG Store</th>
                      <th className="py-2.5 px-2 text-right">Planned Demand (PCS)</th>
                      <th className="py-2.5 px-2 text-right">Master Rate</th>
                      <th className="py-2.5 px-2 text-right">Est. Value (₹)</th>
                      <th className="py-2.5 px-3 text-right">Line Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPrDraftItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No items in draft requisition. Click "+ Add Demand SKU" above to add line items.
                        </td>
                      </tr>
                    ) : (
                      paginatedPrDraftItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          {/* Item Code & Description */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 font-mono text-[11px]">{item.itemCode}</div>
                            <div className="text-[11px] text-slate-600 font-medium">{item.itemName}</div>
                          </td>

                          {/* Customer */}
                          <td className="py-2.5 px-3 text-slate-700">
                            <span className="font-semibold text-slate-800 truncate block max-w-[150px]">{item.customer}</span>
                          </td>

                          {/* FG Store (Editable) */}
                          <td className="py-2.5 px-2">
                            <select
                              value={item.fgStore}
                              onChange={(e) => handleUpdatePrDraftItemStore(item.id, e.target.value)}
                              className="border border-slate-200 rounded px-2 py-1 text-xs bg-white text-slate-700 focus:ring-1 focus:ring-[#0F8B8D]"
                            >
                              <option value="FG-Automotive Cell">FG-Automotive Cell</option>
                              <option value="FG-Main Warehouse">FG-Main Warehouse</option>
                              <option value="FG-Cleanroom Store">FG-Cleanroom Store</option>
                              <option value="FG-Secondary Store">FG-Secondary Store</option>
                            </select>
                          </td>

                          {/* Planned Demand (In-place Editable) */}
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.plannedQty}
                              onChange={(e) => handleUpdatePrDraftItemQty(item.id, parseInt(e.target.value, 10) || 0)}
                              className="w-24 px-2 py-1 border border-indigo-300 rounded text-right font-bold text-indigo-950 bg-indigo-50/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] text-xs"
                            />
                          </td>

                          {/* Master Rate (Locked) */}
                          <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                              <span>₹{item.rate.toFixed(2)}</span>
                            </span>
                          </td>

                          {/* Est Value */}
                          <td className="py-2.5 px-2 text-right font-bold text-slate-900 font-mono">
                            ₹{(item.totalValue / 100000).toFixed(2)}L
                          </td>

                          {/* Line Actions: + Order Button inside Grid & Delete */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Task-4: In-grid + Order button */}
                              <button
                                type="button"
                                onClick={() => handleCreateOrderFromPrLine(item)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                title={`Create Sales Order for SKU ${item.itemCode}`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Order</span>
                              </button>

                              {/* In-grid Delete Line Item */}
                              <button
                                type="button"
                                onClick={() => handleDeletePrDraftItem(item.id)}
                                className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition cursor-pointer"
                                title="Remove line item from PR"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* High Capacity Pagination Bar for Draft Lines */}
              <div className="p-3 border-t border-gray-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 mt-2 rounded-xl">
                <div>
                  Showing <b>{filteredPrDraftItems.length === 0 ? 0 : (prPage - 1) * prPageSize + 1}</b> to{' '}
                  <b>{Math.min(prPage * prPageSize, filteredPrDraftItems.length)}</b> of{' '}
                  <b>{filteredPrDraftItems.length}</b> draft demand lines
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={prPage <= 1}
                    onClick={() => setPrPage(1)}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={prPage <= 1}
                    onClick={() => setPrPage((p) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 py-1 text-xs font-semibold text-slate-800">
                    Page {prPage} of {totalPrDraftPages}
                  </span>
                  <button
                    disabled={prPage >= totalPrDraftPages}
                    onClick={() => setPrPage((p) => Math.min(p + 1, totalPrDraftPages))}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={prPage >= totalPrDraftPages}
                    onClick={() => setPrPage(totalPrDraftPages)}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsSalesPrModalOpen(false);
                  setSelectedSalesPrUnit(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitUnitPr}
                disabled={prDraftItems.length === 0}
                className="px-5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] disabled:opacity-50 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Generate &amp; Submit Purchase Requisition (PR)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brand New Monthly Plan Modal (Initial Create) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#14213D] text-white rounded-xl shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Create Monthly Plan Order (Demand Forecast)
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Supply commitment &amp; customer forecast schedule. Not auto-deducted by daily dispatches.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target Customer</label>
                  <select
                    value={newPlanCustomer}
                    onChange={(e) => setNewPlanCustomer(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none"
                  >
                    <option value="Tata Motors Passenger Vehicles Ltd">Tata Motors Passenger Vehicles Ltd</option>
                    <option value="Marico FMCG Consumer Products">Marico FMCG Consumer Products</option>
                    <option value="Bajaj Auto Ltd Chakan Works">Bajaj Auto Ltd Chakan Works</option>
                    <option value="Mahindra Automotive Div">Mahindra Automotive Div</option>
                    <option value="Motherson Sumi Systems">Motherson Sumi Systems</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Plan Month Period</label>
                  <input
                    type="text"
                    value={newPlanMonth}
                    onChange={(e) => setNewPlanMonth(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Manufacturing Plant</label>
                  <select
                    value={newPlanPlant}
                    onChange={(e) => setNewPlanPlant(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none"
                  >
                    <option value="Plant 1 - Pimpri Auto-Hub">Plant 1 - Pimpri Auto-Hub</option>
                    <option value="Plant 2 - Chakan Moulding">Plant 2 - Chakan Moulding</option>
                    <option value="Plant 3 - Sanand Polymers">Plant 3 - Sanand Polymers</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Plan Classification</label>
                  <select
                    value={newPlanType}
                    onChange={(e) => setNewPlanType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none"
                  >
                    <option value="Monthly supply plan">Monthly supply plan</option>
                    <option value="Forecast">Forecast</option>
                    <option value="Rate contract">Rate contract</option>
                    <option value="Billable monthly order">Billable monthly order</option>
                  </select>
                </div>
              </div>

              {/* Item Details */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="font-bold text-gray-800 flex items-center justify-between">
                  <span>Planned Line Item</span>
                  <span className="text-[11px] font-normal text-gray-500">Auto-calculated value</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-1">Item Code</label>
                    <select
                      value={newPlanItemCode}
                      onChange={(e) => {
                        setNewPlanItemCode(e.target.value);
                        if (e.target.value === 'FG-AUTO-012') {
                          setNewPlanItemName('ABS Dashboard Trim Bezel (Matte Black)');
                          setNewPlanRate('42.50');
                        } else if (e.target.value === 'FG-AUTO-045') {
                          setNewPlanItemName('PP Air Duct Housing - Front Left');
                          setNewPlanRate('28.75');
                        } else if (e.target.value === 'FG-FLIP-28') {
                          setNewPlanItemName('28mm PP Flip-Top Dispenser Cap (Parachute Blue)');
                          setNewPlanRate('15.00');
                        } else if (e.target.value === 'FG-MOTO-088') {
                          setNewPlanItemName('Nylon-6 Reinforced Rear Mudguard Cowl');
                          setNewPlanRate('95.00');
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg p-2 bg-white"
                    >
                      <option value="FG-AUTO-012">FG-AUTO-012 (Dashboard Trim Bezel)</option>
                      <option value="FG-AUTO-045">FG-AUTO-045 (Air Duct Housing)</option>
                      <option value="FG-FLIP-28">FG-FLIP-28 (28mm Flip-Top Cap)</option>
                      <option value="FG-MOTO-088">FG-MOTO-088 (Rear Mudguard Cowl)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Item Description</label>
                    <input
                      type="text"
                      value={newPlanItemName}
                      onChange={(e) => setNewPlanItemName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Planned Quantity (PCS)</label>
                    <input
                      type="number"
                      min="1"
                      value={newPlanQty}
                      onChange={(e) => setNewPlanQty(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Unit Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPlanRate}
                      onChange={(e) => setNewPlanRate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Estimated Monthly Commitment Value:</span>
                  <span className="text-base font-extrabold text-[#14213D]">
                    ₹{((parseFloat(newPlanQty) || 0) * (parseFloat(newPlanRate) || 0)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Commitment Notes &amp; Call-off Rules</label>
                <textarea
                  rows={2}
                  value={newPlanNotes}
                  onChange={(e) => setNewPlanNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              
              {/* Task-2: Save & Create Sales Order */}
              <button
                onClick={() => {
                  const qty = parseInt(newPlanQty, 10) || 10000;
                  const rate = parseFloat(newPlanRate) || 35;
                  const totalVal = qty * rate;
                  const randomSuffix = Math.floor(10 + Math.random() * 90);
                  const generatedId = `PLN-2026-10-${randomSuffix}`;

                  const newPlanObj: MonthlyPlanOrder = {
                    id: generatedId,
                    customer: newPlanCustomer,
                    customerGstin: '27AAACG0943A1ZX',
                    monthPeriod: newPlanMonth || 'October 2026',
                    planType: newPlanType,
                    consumptionMode: 'Manual reconciliation',
                    billingMode: 'Reconciliation only',
                    status: 'Published',
                    plant: newPlanPlant,
                    fgStore: 'FG-Automotive Cell',
                    createdDate: new Date().toISOString().slice(0, 10),
                    items: [
                      {
                        itemCode: newPlanItemCode,
                        itemName: newPlanItemName,
                        hsn: '39269099',
                        plannedQty: qty,
                        deliveredQty: 0,
                        invoicedQty: 0,
                        remainingQty: qty,
                        rate,
                        uom: 'PCS',
                        plant: newPlanPlant,
                        fgStore: 'FG-Automotive Cell',
                      },
                    ],
                    totalPlannedQty: qty,
                    totalDailySuppliedQty: 0,
                    remainingPlanQty: qty,
                    varianceQty: -qty,
                    variancePct: -100,
                    totalPlannedValue: totalVal,
                    notes: newPlanNotes,
                    auditTrail: [
                      {
                        action: 'Monthly Plan Created & Linked to Sales Order Wizard',
                        user: 'Supply Planning Executive',
                        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                        note: 'Created via Monthly Demand Planning Center',
                      },
                    ],
                  };

                  setPlans((prev) => [newPlanObj, ...prev]);
                  if (onCreatePlan) onCreatePlan(newPlanObj);
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                  showToast(`✓ Plan ${generatedId} created. Transitioning to Sales Order creation...`);
                  onNavigate('soWizard', {
                    linkedPlanId: generatedId,
                    monthPeriod: newPlanMonth,
                    customer: newPlanCustomer,
                    plant: newPlanPlant,
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Save &amp; Create Sales Order</span>
              </button>

              <button
                onClick={() => {
                  const qty = parseInt(newPlanQty, 10) || 10000;
                  const rate = parseFloat(newPlanRate) || 35;
                  const totalVal = qty * rate;
                  const randomSuffix = Math.floor(10 + Math.random() * 90);
                  const generatedId = `PLN-2026-10-${randomSuffix}`;

                  const newPlanObj: MonthlyPlanOrder = {
                    id: generatedId,
                    customer: newPlanCustomer,
                    customerGstin: '27AAACG0943A1ZX',
                    monthPeriod: newPlanMonth || 'October 2026',
                    planType: newPlanType,
                    consumptionMode: 'Manual reconciliation',
                    billingMode: 'Reconciliation only',
                    status: 'Published',
                    plant: newPlanPlant,
                    fgStore: 'FG-Automotive Cell',
                    createdDate: new Date().toISOString().slice(0, 10),
                    items: [
                      {
                        itemCode: newPlanItemCode,
                        itemName: newPlanItemName,
                        hsn: '39269099',
                        plannedQty: qty,
                        deliveredQty: 0,
                        invoicedQty: 0,
                        remainingQty: qty,
                        rate,
                        uom: 'PCS',
                        plant: newPlanPlant,
                        fgStore: 'FG-Automotive Cell',
                      },
                    ],
                    totalPlannedQty: qty,
                    totalDailySuppliedQty: 0,
                    remainingPlanQty: qty,
                    varianceQty: -qty,
                    variancePct: -100,
                    totalPlannedValue: totalVal,
                    notes: newPlanNotes,
                    auditTrail: [
                      {
                        action: 'Monthly Plan Created',
                        user: 'Supply Planning Executive',
                        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                        note: 'Created via Monthly Demand Planning Center',
                      },
                    ],
                  };

                  setPlans((prev) => [newPlanObj, ...prev]);
                  if (onCreatePlan) onCreatePlan(newPlanObj);
                  showToast(`Monthly Plan Order ${generatedId} created successfully.`);
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg font-semibold shadow-xs transition"
              >
                Confirm &amp; Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


