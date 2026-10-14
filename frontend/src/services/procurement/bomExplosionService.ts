// Consolidated Multi-Item BOM Material Explosion & Supplier Intelligence Engine
export interface UnitStockBreakdown {
  plant1Stock: number;
  plant2Stock: number;
  centralWarehouseStock: number;
  totalFreeStock: number;
}

export interface SupplierOption {
  supplierId: string;
  supplierName: string;
  ratePerUom: number;
  leadTimeDays: number;
  rating: number;
  moq: number;
  paymentTerms: string;
}

export interface PlantBomExplodedItem {
  rawItemCode: string;
  rawItemName: string;
  category: string;
  grossRequiredKg: number;
  unitStock: UnitStockBreakdown;
  currentStockKg: number; // sum
  safetyBufferKg: number;
  netNeedKg: number;
  orderQty: number; // Editable by PO person
  unitPrice: number;
  totalCost: number;
  uom: string;
  selectedSupplierId: string;
  selectedSupplierName: string;
  availableSuppliers: SupplierOption[];
  leadTimeDays: number;
  supplierRating: number;
  stockStatus: 'Critical Shortage' | 'Partial Stock' | 'Sufficient Buffer';
  // PO Conversion tracking
  isPoConfirmed?: boolean;
  confirmedPoNumber?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  isLocked?: boolean;
}

export interface BomRecipeVersion {
  versionId: string;
  versionCode: string; // 'BOM-v1.0', 'BOM-v2.1-Eco', etc.
  versionName: string;
  description: string;
  components: {
    rawItemCode: string;
    rawItemName: string;
    category: string;
    ratioPerPiece: number; // e.g., 0.45 KG per PC
    uom: string;
    defaultRate: number;
  }[];
  isDefault?: boolean;
}

export interface PrFinishedGoodItem {
  itemCode: string;
  itemName: string;
  plannedQty: number;
  uom: string;
  selectedBomVersion: string; // 'BOM-v1.0'
  availableBomVersions: BomRecipeVersion[];
  lastCreatedPo?: string;
  lastModified?: string;
  isLocked?: boolean;
}

export interface BomInputItem {
  id?: string;
  itemCode?: string;
  itemName?: string;
  plannedQty?: number;
  quantity?: number;
  rate?: number;
  uom?: string;
  bomVersion?: string;
}

// Pre-defined Approved Supplier Catalog
export const APPROVED_SUPPLIERS_CATALOG: Record<string, SupplierOption[]> = {
  'Polymer Granules': [
    {
      supplierId: 'SUP-S0128',
      supplierName: 'RELIANCE INDUSTRIES LIMITED',
      ratePerUom: 88.5,
      leadTimeDays: 3,
      rating: 98.5,
      moq: 1000,
      paymentTerms: 'Net 30 Days',
    },
    {
      supplierId: 'SUP-S0129',
      supplierName: 'INDIAN OIL CORPORATION LTD (IOCL)',
      ratePerUom: 87.2,
      leadTimeDays: 4,
      rating: 96.8,
      moq: 2000,
      paymentTerms: 'Net 45 Days',
    },
    {
      supplierId: 'SUP-S0130',
      supplierName: 'GAIL INDIA PETROCHEMICALS',
      ratePerUom: 89.0,
      leadTimeDays: 5,
      rating: 95.4,
      moq: 1500,
      paymentTerms: 'Net 30 Days',
    },
  ],
  'Color Masterbatch': [
    {
      supplierId: 'SUP-S0045',
      supplierName: 'CLARIANT COLORANTS CHEMICALS INDIA',
      ratePerUom: 340.0,
      leadTimeDays: 5,
      rating: 97.2,
      moq: 50,
      paymentTerms: 'Net 30 Days',
    },
    {
      supplierId: 'SUP-S0046',
      supplierName: 'SUPREME MASTERBATCH LTD',
      ratePerUom: 325.0,
      leadTimeDays: 3,
      rating: 94.8,
      moq: 100,
      paymentTerms: 'Net 15 Days',
    },
    {
      supplierId: 'SUP-S0047',
      supplierName: 'PODDAR PIGMENTS LTD',
      ratePerUom: 335.0,
      leadTimeDays: 4,
      rating: 95.5,
      moq: 50,
      paymentTerms: 'Net 30 Days',
    },
  ],
  'Performance Additive': [
    {
      supplierId: 'SUP-S0078',
      supplierName: 'BASF PERFORMANCE CHEMICALS INDIA',
      ratePerUom: 520.0,
      leadTimeDays: 7,
      rating: 99.1,
      moq: 25,
      paymentTerms: 'Net 45 Days',
    },
    {
      supplierId: 'SUP-S0079',
      supplierName: 'SOLVAY SPECIALTY CHEMICALS LTD',
      ratePerUom: 510.0,
      leadTimeDays: 6,
      rating: 97.0,
      moq: 50,
      paymentTerms: 'Net 30 Days',
    },
  ],
  'Secondary Packaging': [
    {
      supplierId: 'SUP-S0164',
      supplierName: 'PARKSONS PACKAGING LTD',
      ratePerUom: 65.0,
      leadTimeDays: 2,
      rating: 96.8,
      moq: 500,
      paymentTerms: 'Net 30 Days',
    },
    {
      supplierId: 'SUP-S0165',
      supplierName: 'UFLEX PACKAGING DIVISION',
      ratePerUom: 62.5,
      leadTimeDays: 4,
      rating: 95.0,
      moq: 1000,
      paymentTerms: 'Net 30 Days',
    },
    {
      supplierId: 'SUP-S0166',
      supplierName: 'TCPL PACKAGING LIMITED',
      ratePerUom: 64.0,
      leadTimeDays: 3,
      rating: 96.2,
      moq: 500,
      paymentTerms: 'Net 15 Days',
    },
  ],
};

// Standard BOM Recipe Matrix for Finished Goods
export const STANDARD_FG_BOM_MATRIX: Record<string, BomRecipeVersion[]> = {
  DEFAULT: [
    {
      versionId: 'V1',
      versionCode: 'BOM-v1.0 (Prime Virgin Standard)',
      versionName: 'Prime Virgin Grade 100%',
      description: 'Standard 100% Prime Virgin Polypropylene Formulation with 1.5% Automotive Grade Masterbatch',
      isDefault: true,
      components: [
        {
          rawItemCode: 'RM-PP-NAT-001',
          rawItemName: 'Polypropylene Injection Grade Virgin Resin H110MA',
          category: 'Polymer Granules',
          ratioPerPiece: 0.425,
          uom: 'KG',
          defaultRate: 88.5,
        },
        {
          rawItemCode: 'MB-BLK-002',
          rawItemName: 'Carbon Black Masterbatch 40% Concentration (Automotive Grade)',
          category: 'Color Masterbatch',
          ratioPerPiece: 0.015,
          uom: 'KG',
          defaultRate: 340.0,
        },
        {
          rawItemCode: 'AD-UV-STAB-003',
          rawItemName: 'UV Stabilizer & Thermal Antioxidant Clarifier',
          category: 'Performance Additive',
          ratioPerPiece: 0.005,
          uom: 'KG',
          defaultRate: 520.0,
        },
        {
          rawItemCode: 'PKG-BOX-5PLY-01',
          rawItemName: '5-Ply Heavy-Duty Corrugated Master Cartons',
          category: 'Secondary Packaging',
          ratioPerPiece: 0.025,
          uom: 'BOX',
          defaultRate: 65.0,
        },
      ],
    },
    {
      versionId: 'V2',
      versionCode: 'BOM-v2.1 (Eco PCR 30% Blend)',
      versionName: '30% Post-Consumer Recycled Blend',
      description: 'Circular Economy Blend: 70% Virgin + 30% Reprocessed Polymer with Enhanced Impact Modifier',
      isDefault: false,
      components: [
        {
          rawItemCode: 'RM-PP-NAT-001',
          rawItemName: 'Polypropylene Injection Grade Virgin Resin H110MA',
          category: 'Polymer Granules',
          ratioPerPiece: 0.300,
          uom: 'KG',
          defaultRate: 88.5,
        },
        {
          rawItemCode: 'RM-PP-PCR-002',
          rawItemName: 'Post-Consumer Recycled (PCR) PP Granules Reprocessed',
          category: 'Polymer Granules',
          ratioPerPiece: 0.130,
          uom: 'KG',
          defaultRate: 62.0,
        },
        {
          rawItemCode: 'MB-BLK-002',
          rawItemName: 'Carbon Black Masterbatch 40% Concentration (Automotive Grade)',
          category: 'Color Masterbatch',
          ratioPerPiece: 0.018,
          uom: 'KG',
          defaultRate: 340.0,
        },
        {
          rawItemCode: 'AD-UV-STAB-003',
          rawItemName: 'UV Stabilizer & Thermal Antioxidant Clarifier',
          category: 'Performance Additive',
          ratioPerPiece: 0.008,
          uom: 'KG',
          defaultRate: 520.0,
        },
        {
          rawItemCode: 'PKG-BOX-5PLY-01',
          rawItemName: '5-Ply Heavy-Duty Corrugated Master Cartons',
          category: 'Secondary Packaging',
          ratioPerPiece: 0.025,
          uom: 'BOX',
          defaultRate: 65.0,
        },
      ],
    },
    {
      versionId: 'V3',
      versionCode: 'BOM-v3.0 (High Impact GF 15%)',
      versionName: 'Glass-Fiber Reinforced High Strength',
      description: 'Engineering Grade 15% Short Glass Fiber Reinforced Formulation for Extreme Tensile & Heat Resistance',
      isDefault: false,
      components: [
        {
          rawItemCode: 'RM-PA6-GF30-01',
          rawItemName: 'Polyamide 6 (Nylon 6) 30% Glass Filled Granules',
          category: 'Polymer Granules',
          ratioPerPiece: 0.490,
          uom: 'KG',
          defaultRate: 145.0,
        },
        {
          rawItemCode: 'MB-BLK-002',
          rawItemName: 'Carbon Black Masterbatch 40% Concentration (Automotive Grade)',
          category: 'Color Masterbatch',
          ratioPerPiece: 0.015,
          uom: 'KG',
          defaultRate: 340.0,
        },
        {
          rawItemCode: 'AD-IMP-MOD-004',
          rawItemName: 'Elastomeric Impact Modifier Core-Shell',
          category: 'Performance Additive',
          ratioPerPiece: 0.012,
          uom: 'KG',
          defaultRate: 680.0,
        },
        {
          rawItemCode: 'PKG-BOX-5PLY-01',
          rawItemName: '5-Ply Heavy-Duty Corrugated Master Cartons',
          category: 'Secondary Packaging',
          ratioPerPiece: 0.025,
          uom: 'BOX',
          defaultRate: 65.0,
        },
      ],
    },
  ],
};

/**
 * Returns available BOM versions for a given Finished Good item code.
 */
export function getBomVersionsForFgItem(itemCode: string): BomRecipeVersion[] {
  return STANDARD_FG_BOM_MATRIX[itemCode] || STANDARD_FG_BOM_MATRIX.DEFAULT;
}

/**
 * Computes live consolidated multi-item BOM explosion across all finished goods in a PR/Plan
 * given their selected BOM version.
 */
export function computeConsolidatedBomExplosion(
  plantName: string = 'Plant 1',
  fgItems: PrFinishedGoodItem[],
  existingPoOverrides: Record<string, Partial<PlantBomExplodedItem>> = {}
): PlantBomExplodedItem[] {
  const isPlant1 = plantName.toLowerCase().includes('plant 1') || plantName.toLowerCase().includes('pimpri') || plantName.toLowerCase().includes('pune');
  const isPlant2 = plantName.toLowerCase().includes('plant 2') || plantName.toLowerCase().includes('chakan');

  // Consolidator map: rawItemCode -> Aggregated requirement
  const consolidatedMap: Record<
    string,
    {
      rawItemCode: string;
      rawItemName: string;
      category: string;
      grossQty: number;
      uom: string;
      defaultRate: number;
    }
  > = {};

  // Explode each FG line item using its active BOM recipe version
  fgItems.forEach((fg) => {
    const versions = getBomVersionsForFgItem(fg.itemCode);
    const activeVersion =
      versions.find((v) => v.versionCode === fg.selectedBomVersion) ||
      versions[0];

    const plannedQty = Number(fg.plannedQty) || 1000;

    activeVersion.components.forEach((comp) => {
      const requiredQty = comp.ratioPerPiece * plannedQty;

      if (!consolidatedMap[comp.rawItemCode]) {
        consolidatedMap[comp.rawItemCode] = {
          rawItemCode: comp.rawItemCode,
          rawItemName: comp.rawItemName,
          category: comp.category,
          grossQty: 0,
          uom: comp.uom,
          defaultRate: comp.defaultRate,
        };
      }

      consolidatedMap[comp.rawItemCode].grossQty += requiredQty;
    });
  });

  // If no items were provided, fallback to standard plant default explosion
  if (Object.keys(consolidatedMap).length === 0) {
    const def = STANDARD_FG_BOM_MATRIX.DEFAULT[0];
    def.components.forEach((c) => {
      consolidatedMap[c.rawItemCode] = {
        rawItemCode: c.rawItemCode,
        rawItemName: c.rawItemName,
        category: c.category,
        grossQty: c.ratioPerPiece * 50000,
        uom: c.uom,
        defaultRate: c.defaultRate,
      };
    });
  }

  // Build final consolidated table with unit-wise stock breakdown & approved suppliers
  const results: PlantBomExplodedItem[] = Object.values(consolidatedMap).map((mat) => {
    const grossNeeded = Math.round(mat.grossQty);

    // Multi-unit live stock distribution
    let p1Stock = 0;
    let p2Stock = 0;
    let cwhStock = 0;

    if (mat.uom === 'KG') {
      if (mat.category === 'Polymer Granules') {
        p1Stock = isPlant1 ? 18500 : 11000;
        p2Stock = isPlant2 ? 14200 : 9500;
        cwhStock = 28000;
      } else if (mat.category === 'Color Masterbatch') {
        p1Stock = isPlant1 ? 650 : 380;
        p2Stock = isPlant2 ? 480 : 320;
        cwhStock = 1200;
      } else {
        p1Stock = isPlant1 ? 140 : 80;
        p2Stock = isPlant2 ? 110 : 70;
        cwhStock = 350;
      }
    } else {
      // BOX / PACKAGING
      p1Stock = isPlant1 ? 920 : 540;
      p2Stock = isPlant2 ? 780 : 420;
      cwhStock = 1800;
    }

    const currentPlantStock = isPlant2 ? p2Stock : p1Stock;
    const totalFreeStock = p1Stock + p2Stock + cwhStock;
    const safetyBuffer = Math.round(grossNeeded * 0.12);
    const netNeed = Math.max(0, grossNeeded - currentPlantStock + safetyBuffer);

    const suppliers = APPROVED_SUPPLIERS_CATALOG[mat.category] || APPROVED_SUPPLIERS_CATALOG['Polymer Granules'];
    const defaultSup = suppliers[0];

    const override = existingPoOverrides[mat.rawItemCode];

    const orderQty = override?.orderQty !== undefined ? override.orderQty : netNeed;
    const selectedSupId = override?.selectedSupplierId || defaultSup.supplierId;
    const selectedSup = suppliers.find((s) => s.supplierId === selectedSupId) || defaultSup;
    const unitPrice = selectedSup.ratePerUom;
    const totalCost = orderQty * unitPrice;

    return {
      rawItemCode: mat.rawItemCode,
      rawItemName: mat.rawItemName,
      category: mat.category,
      grossRequiredKg: grossNeeded,
      unitStock: {
        plant1Stock: p1Stock,
        plant2Stock: p2Stock,
        centralWarehouseStock: cwhStock,
        totalFreeStock: totalFreeStock,
      },
      currentStockKg: currentPlantStock,
      safetyBufferKg: safetyBuffer,
      netNeedKg: netNeed,
      orderQty: orderQty,
      unitPrice: unitPrice,
      totalCost: totalCost,
      uom: mat.uom,
      selectedSupplierId: selectedSup.supplierId,
      selectedSupplierName: selectedSup.supplierName,
      availableSuppliers: suppliers,
      leadTimeDays: selectedSup.leadTimeDays,
      supplierRating: selectedSup.rating,
      stockStatus: netNeed > 10000 ? 'Critical Shortage' : netNeed > 0 ? 'Partial Stock' : 'Sufficient Buffer',
      isPoConfirmed: override?.isPoConfirmed || false,
      confirmedPoNumber: override?.confirmedPoNumber,
      confirmedAt: override?.confirmedAt,
      confirmedBy: override?.confirmedBy,
      isLocked: override?.isLocked || override?.isPoConfirmed || false,
    };
  });

  return results;
}

// Backward-compatible wrapper
export function computePlantBomExplosion(
  plantName: string = 'Plant 1',
  items: BomInputItem[] = []
): PlantBomExplodedItem[] {
  const fgItems: PrFinishedGoodItem[] = items.map((it, idx) => ({
    itemCode: it.itemCode || `FG-${idx + 1}`,
    itemName: it.itemName || `Finished Good ${idx + 1}`,
    plannedQty: Number(it.plannedQty) || Number(it.quantity) || 10000,
    uom: it.uom || 'PCS',
    selectedBomVersion: it.bomVersion || 'BOM-v1.0 (Prime Virgin Standard)',
    availableBomVersions: STANDARD_FG_BOM_MATRIX.DEFAULT,
  }));

  return computeConsolidatedBomExplosion(plantName, fgItems);
}
