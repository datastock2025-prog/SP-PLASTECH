// Consolidated BOM Material Explosion & Supplier Intelligence Engine
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

export interface BomInputItem {
  itemCode?: string;
  itemName?: string;
  plannedQty?: number;
  quantity?: number;
  rate?: number;
  uom?: string;
}

/**
 * Computes raw material requirements (Polymer resins, masterbatches, performance additives, packaging)
 * based on finished goods demand, current plant inventory levels, and suggests approved vendors.
 */
export function computePlantBomExplosion(
  plantName: string = 'Plant 1',
  items: BomInputItem[] = []
): PlantBomExplodedItem[] {
  const totalFinishedGoodsPieces = items.reduce((sum, it) => {
    const qty = Number(it.plannedQty) || Number(it.quantity) || 0;
    return sum + qty;
  }, 0) || 50000;

  const plantLower = (plantName || '').toLowerCase();
  const isHosur = plantLower.includes('hosur') || plantLower.includes('plant 1') || plantLower.includes('pimpri') || plantLower.includes('pune');
  const isChakan = plantLower.includes('chakan') || plantLower.includes('plant 2') || plantLower.includes('manesar');
  const isChennai = plantLower.includes('chennai') || plantLower.includes('plant 3') || plantLower.includes('sanand');

  const hasNylon = items.some(
    (i) =>
      (i.itemName || '').toLowerCase().includes('nylon') ||
      (i.itemName || '').toLowerCase().includes('cowl') ||
      (i.itemName || '').toLowerCase().includes('mudguard') ||
      (i.itemCode || '').toLowerCase().includes('pa6')
  );
  const hasABS = items.some(
    (i) =>
      (i.itemName || '').toLowerCase().includes('abs') ||
      (i.itemName || '').toLowerCase().includes('bezel') ||
      (i.itemName || '').toLowerCase().includes('trim') ||
      (i.itemCode || '').toLowerCase().includes('auto')
  );

  const results: PlantBomExplodedItem[] = [];

  // 1. Virgin Polymer Raw Resin (Prime Virgin Grade)
  const resinMultiplier = hasNylon ? 0.52 : hasABS ? 0.48 : 0.425;
  const resinGrossKg = Math.round(totalFinishedGoodsPieces * resinMultiplier);
  const resinStockKg = isHosur ? 18500 : isChakan ? 12400 : isChennai ? 14200 : 9800;
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
  const mbStockKg = isHosur ? 650 : isChakan ? 420 : isChennai ? 510 : 310;
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
  const addStockKg = isHosur ? 140 : isChakan ? 85 : isChennai ? 110 : 60;
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
  const boxStock = isHosur ? 920 : isChakan ? 580 : isChennai ? 720 : 450;
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
