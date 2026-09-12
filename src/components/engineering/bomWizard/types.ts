import { ItemMaster, BomMaster, BomLine, SecondaryOperationDetail, RoutingResourceDetail, ScrapYieldConfig, QualitySpecConfig, BomDocument } from '../../../types';

export type WizardStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface WizardStepMeta {
  id: WizardStepId;
  title: string;
  subtitle: string;
  isOptional?: boolean;
}

export const WIZARD_STEPS: WizardStepMeta[] = [
  { id: 1, title: 'Basic Information', subtitle: 'Identity, numbering & plant' },
  { id: 2, title: 'Manufacturing Type', subtitle: 'Discrete, recipe, or assembly' },
  { id: 3, title: 'Batch & Output', subtitle: 'Batch sizes, cycle times & staging' },
  { id: 4, title: 'Materials & Components', subtitle: 'Raw resins, additives & packaging' },
  { id: 5, title: 'Secondary Operations', subtitle: 'Trimming, assembly & decoration', isOptional: true },
  { id: 6, title: 'Routing & Resources', subtitle: 'Machines, molds & labor skills' },
  { id: 7, title: 'Scrap, Yield & Cost', subtitle: 'Regrind credit & cost rollup' },
  { id: 8, title: 'Quality & Documents', subtitle: 'Inspection plans & drawings' },
  { id: 9, title: 'Review & Finish', subtitle: 'Validation summary & submission' },
];

export interface ManufacturingBomWizardState {
  // Parent item info
  parentItem: ItemMaster;
  
  // Step 1: Basic Information
  bomCode: string;
  isCustomCode: boolean;
  bomName: string;
  bomVersion: string;
  bomType: 'Manufacturing BOM' | 'Engineering BOM' | 'Packaging BOM' | 'Pilot/Prototype BOM';
  effectiveFrom: string;
  effectiveTo: string;
  plantId: string;
  owner: string;
  description: string;
  remarks: string;

  // Step 2: Manufacturing Type
  mfgCategory: 'Discrete Manufacturing BOM' | 'Formula / Recipe BOM' | 'Assembly BOM' | 'Packaging BOM' | 'Secondary Operation BOM';
  multiLevelEnabled: boolean;
  allowSubstitutes: boolean;
  allowRegrind: boolean;
  requireQualityInspection: boolean;
  requireCustomerApproval: boolean;
  autoCreateSecondaryWO: boolean;

  // Step 3: Batch and Output
  batchSize: number;
  batchUOM: string;
  outputQty: number;
  expectedFinishedQty: number;
  expectedScrapQty: number;
  yieldPct: number;
  scrapPct: number;
  cycleTimeSource: 'Item Master' | 'Routing' | 'Machine/Mold Specific' | 'Manual';
  standardCycleTimeSec: number;
  itemNetWeightGrams: number;
  runnerWeightGrams: number;
  totalShotWeightGrams: number;
  moldCavities: number;
  estimatedProductionTimeHours: number;
  defaultInputLocation: string;
  defaultWipLocation: string;
  defaultFgLocation: string;
  defaultSecondaryLocation: string;
  // Formula mode
  totalFormulaPct: number;
  autoBalanceResin: boolean;
  batchWeightKg: number;
  batchWeightUOM: string;

  // Step 4: Materials and Components
  components: BomLine[];

  // Step 5: Secondary Operations
  secondaryOperations: SecondaryOperationDetail[];

  // Step 6: Routing and Resources
  routingResources: RoutingResourceDetail[];

  // Step 7: Scrap, Yield & Cost
  scrapConfig: ScrapYieldConfig;
  materialPriceSource: 'Standard price' | 'Latest purchase price' | 'Average price' | 'Supplier price list';
  laborRatePerHour: number;
  machineRatePerHour: number;
  overheadRatePerHour: number;
  regrindCreditRatePerKg: number;
  costPreviewRan: boolean;
  costRollup: {
    materialCost: number;
    packagingCost: number;
    secondaryOpCost: number;
    laborCost: number;
    machineCost: number;
    moldAmortization: number;
    energyCost: number;
    scrapCost: number;
    regrindCredit: number;
    totalCost: number;
    costPerUnit: number;
    costPerBatch: number;
    costPerKg: number;
  };

  // Step 8: Quality & Documents
  qualityConfig: QualitySpecConfig;
  documents: BomDocument[];
}
