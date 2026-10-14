import {
  WarehouseLocation,
  InventoryStockItem,
  StockMovementLedgerEntry,
  PutawayTask,
  PickPackTask,
  CycleCountSession,
  QuarantineLotRecord,
  RegrindScrapRun,
  SubcontractOrder,
} from '../types/warehouse';

export const INITIAL_WAREHOUSE_LOCATIONS: WarehouseLocation[] = [
  {
    id: 'WH-RM-01',
    code: 'SILO-ZONE-A',
    name: 'Raw Material Polymer Silos & Bulk Bags',
    zone: 'Zone A - Heavy Polymer Silos',
    type: 'bulk_silo',
    capacityKg: 150000,
    currentOccupiedKg: 0,
    occupancyPct: 0,
    temperatureControlled: false,
    activeItemsCount: 0,
    description: 'Bulk silos and pneumatic feeding lines directly connected to injection molding machines.',
  },
  {
    id: 'WH-MB-02',
    code: 'MB-RACK-ZONE-B',
    name: 'Masterbatch & Additive Temperature Controlled Vault',
    zone: 'Zone B - Additives Vault',
    type: 'cold_storage',
    capacityKg: 25000,
    currentOccupiedKg: 0,
    occupancyPct: 0,
    temperatureControlled: true,
    activeItemsCount: 0,
    description: 'Dehumidified 22°C storage for color masterbatches, UV stabilizers, and specialty foaming agents.',
  },
  {
    id: 'WH-FG-03',
    code: 'FG-PALLET-ZONE-C',
    name: 'Finished Goods Pallet High-Bay Racking',
    zone: 'Zone C - Automated High-Bay Racks',
    type: 'pallet_rack',
    capacityKg: 80000,
    currentOccupiedKg: 0,
    occupancyPct: 0,
    temperatureControlled: false,
    activeItemsCount: 0,
    description: 'Finished molded automotive bezels, medical vials, and electrical enclosures packaged in cartons on Euro pallets.',
  },
  {
    id: 'WH-RG-04',
    code: 'REGRIND-ZONE-D',
    name: 'Closed-Loop Regrind & Granulator Silos',
    zone: 'Zone D - Regrind Recycling',
    type: 'bulk_silo',
    capacityKg: 40000,
    currentOccupiedKg: 0,
    occupancyPct: 0,
    temperatureControlled: false,
    activeItemsCount: 0,
    description: 'Clean reground flakes ready for closed-loop proportional blending (up to 15% virgin blend).',
  },
  {
    id: 'WH-QC-05',
    code: 'QUARANTINE-HOLD-01',
    name: 'Quarantine & Off-Spec Hold Cage',
    zone: 'Zone E - Quarantine Area',
    type: 'quarantine_area',
    capacityKg: 20000,
    currentOccupiedKg: 0,
    occupancyPct: 0,
    temperatureControlled: false,
    activeItemsCount: 0,
    description: 'Restricted access holding zone for off-spec polymer lots, high-moisture resin, and supplier NCR items.',
  },
  {
    id: 'WH-TOOL-06',
    code: 'MOLD-CRIB-ZONE-F',
    name: 'Injection Mold & Tooling Heavy Storage',
    zone: 'Zone F - Mold Tooling Crib',
    type: 'tool_crib',
    capacityKg: 120000,
    currentOccupiedKg: 0,
    occupancyPct: 0,
    temperatureControlled: false,
    activeItemsCount: 0,
    description: 'Overhead crane accessible heavy steel racking for hardened P20 and H13 injection mold dies.',
  },
  {
    id: 'WH-ASM-07',
    code: 'ASM-ZONE-G',
    name: 'Assembly & Sub-Assembly Warehouse Store',
    zone: 'Zone G - Sub-Assembly Staging',
    type: 'wip_staging',
    capacityKg: 50000,
    currentOccupiedKg: 0,
    occupancyPct: 0,
    temperatureControlled: false,
    activeItemsCount: 0,
    description: 'Holding zone for molded components awaiting secondary ultrasonic welding, riveting, and packaging sub-assembly.',
  },
  {
    id: 'WH-DFL-08',
    code: 'DFL-ZONE-H',
    name: 'De-Flash & Trimming Buffer Store',
    zone: 'Zone H - De-Flashing Staging',
    type: 'wip_staging',
    capacityKg: 35000,
    currentOccupiedKg: 0,
    occupancyPct: 0,
    temperatureControlled: false,
    activeItemsCount: 0,
    description: 'Staging area for fresh molded parts awaiting manual gate cutting, cryogenic de-flashing, and de-burring.',
  },
];

// Clean live inventory data (No fake mock items)
export const INITIAL_INVENTORY_STOCK: InventoryStockItem[] = [];

export const INITIAL_PUTAWAY_TASKS: PutawayTask[] = [];

export const INITIAL_PICK_PACK_TASKS: PickPackTask[] = [];

export const INITIAL_CYCLE_COUNTS: CycleCountSession[] = [];

export const INITIAL_QUARANTINE_LOTS: QuarantineLotRecord[] = [];

export const INITIAL_REGRIND_RUNS: RegrindScrapRun[] = [];

export const INITIAL_SUBCONTRACT_ORDERS: SubcontractOrder[] = [];

export const INITIAL_STOCK_MOVEMENT_LEDGER: StockMovementLedgerEntry[] = [];
