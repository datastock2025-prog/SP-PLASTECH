# SP-PLASTECH ERP — Business Rules & Calculation Inventory (Phase 0.3)

This inventory lists all business calculations, mathematical formulas, and domain rules discovered across the codebase via AST and regex pattern analysis (`reduce(`, `toFixed`, `Math.`, `* 1.`, `/ 100`).

Per Phase 0.3 protocol, these calculations will be protected with Vitest characterization tests and golden output snapshots (`tests/golden/*.json`) before any refactoring or cleanup.

---

## 1. Domain Calculations by Module

### 1. BOM Explosion & Recipe Scaling
- **Files**:
  - `src/services/procurement/bomExplosionService.ts`
  - `src/components/engineering/RecipeFormulaScalerModal.tsx`
  - `src/components/engineering/BomTreeViewerModal.tsx`
- **Key Formulas / Rules**:
  - `grossNeeded = Math.round(mat.grossQty)`
  - `safetyBuffer = Math.round(grossNeeded * 0.12)` (12% safety buffer)
  - `netNeed = Math.max(0, grossNeeded - currentPlantStock + safetyBuffer)`
  - Multi-level BOM scaling by target production batch weight / cavity multiplier.

### 2. JIT Calculations & Production Scheduling
- **Files**:
  - `src/services/planning/jitScheduleDataService.ts`
  - `src/components/planning/JitProductionPlannerView.tsx`
- **Key Formulas / Rules**:
  - `scrapFactor = 1 + (line.scrap || 0) / 100`
  - Total planned hours per machine: `cycleTimeSeconds * targetQuantity / 3600 / cavities`
  - Daily capacity utilization % and machine load allocation.

### 3. MRP Engine (Material Requirements Planning)
- **Files**:
  - `src/services/planning/planning.api.ts`
  - `src/components/planning/MrpPlanningEngineView.tsx`
- **Key Formulas / Rules**:
  - Gross Requirement - (On-Hand Stock + Scheduled Receipts - Allocated Stock - Safety Stock) = Net Requirement
  - Planned Order Release date calculation: `Requirement Date - Lead Time Days`.

### 4. GST, Tax Invoices, Line Items & Totals
- **Files**:
  - `src/services/pdf/dispatchPdfGenerator.ts`
  - `src/services/nic/MockNicEwbProvider.ts`
  - `src/components/finance/TaxWorkbenchView.tsx`
  - `src/components/sales/SalesOrderFormModal.tsx`
- **Key Formulas / Rules**:
  - `lineTotal = quantity * unitPrice * (1 - discountPct / 100)`
  - Intra-state GST: `CGST = taxableValue * (gstPct / 200)`, `SGST = taxableValue * (gstPct / 200)`
  - Inter-state GST: `IGST = taxableValue * (gstPct / 100)`
  - Total Invoice Value: `taxableValue + CGST + SGST + IGST + roundingAdjustment`.

### 5. OEE (Overall Equipment Effectiveness) & Downtime Matrix
- **Files**:
  - `src/services/analytics/universalQueryEngine.ts`
  - `src/components/manufacturing/OeeDashboardView.tsx`
  - `src/components/manufacturing/ScrapDowntimeMatrixView.tsx`
- **Key Formulas / Rules**:
  - `Availability = (Operating Time / Planned Production Time) * 100`
  - `Performance = ((Total Parts * Ideal Cycle Time) / Operating Time) * 100`
  - `Quality = (Good Parts / Total Parts) * 100`
  - `OEE = (Availability * Performance * Quality) / 10000`
  - Pareto scrap loss ranking and downtime category percentages.

### 6. Costing Modeler & Standard Margins
- **Files**:
  - `src/services/finance/finance.api.ts`
  - `src/components/finance/ProductCostingView.tsx`
  - `src/components/sales/CostingModelerView.tsx`
- **Key Formulas / Rules**:
  - `Material Cost = Shot Weight (g) * Polymer Rate (₹/kg) / 1000`
  - `Machine Cost = (Cycle Time / 3600) * Machine Hourly Rate`
  - `Labor Cost = (Cycle Time / 3600) * Operator Hourly Rate / Cavities`
  - `Manufacturing Cost = Material Cost + Machine Cost + Labor Cost + Scrap Allowance`
  - `Gross Margin % = ((Selling Price - Manufacturing Cost) / Selling Price) * 100`.

### 7. FEFO / FIFO Batch Allocation & Stock Availability
- **Files**:
  - `src/services/salesDataService.ts`
  - `src/components/warehouse/StockOverviewView.tsx`
- **Key Formulas / Rules**:
  - First-Expiry First-Out (FEFO) sort order: `expiryDate ASC`
  - Allocation: `allocatedQty = Math.min(requestedQty, availableBatchQty)`
  - Remaining: `newAvailable = Math.max(0, batch.availableQty - matched.qty)`.

### 8. Closed-Loop Regrind (RG) Material Recycling
- **Files**:
  - `src/services/regrindMaterialService.ts`
- **Key Formulas / Rules**:
  - `rejectionKg = (rejectionQty * partWeightGrams) / 1000`
  - `cycles = Math.ceil(producedQty / Math.max(1, cavityCount))`
  - `runnerKg = (cycles * runnerWeightGrams) / 1000`
  - `lumpsKg = wo.lumpsQty ?? (rejectionQty > 0 ? (rejectionQty * partWeightGrams * 0.2) / 1000 : 2.5)`
  - `totalScrapKg = rejectionKg + runnerKg + lumpsKg`
  - `pendingRgKg = Math.max(0, totalScrapKg - rgLoggedKg)`.

### 9. Credit Control & Outstanding Exposure
- **Files**:
  - `src/components/finance/CreditControlWorkbenchView.tsx`
  - `src/components/sales/SalesOrderFormModal.tsx`
- **Key Formulas / Rules**:
  - `Total Exposure = Total Unpaid AR Invoices + Total Open Sales Orders`
  - Credit Check: `Total Exposure > Approved Credit Limit => Hard Block / Approval Required`
  - Days Sales Outstanding (DSO): `(Total AR / Total Credit Sales) * Period Days`.

### 10. Three-Way Matching (3-Way Match)
- **Files**:
  - `src/components/finance/ThreeWayMatchView.tsx`
  - `src/components/procurement/ThreeWayMatchInvoicesView.tsx`
- **Key Formulas / Rules**:
  - Quantity Match: `Invoice Qty <= GRN Accepted Qty`
  - Rate Match: `abs(Invoice Rate - PO Rate) <= Rate Tolerance (e.g. 1%)`
  - Discrepancy Amount: `(Invoice Qty * Invoice Rate) - (GRN Qty * PO Rate)`.

### 11. HR Payroll & Statutory Slips
- **Files**:
  - `src/services/hr/hr.api.ts`
  - `src/components/hr/HrPayrollSlipsView.tsx`
- **Key Formulas / Rules**:
  - Gross Earnings: `Basic + HRA + DA + Special Allowances`
  - Provident Fund (PF): `Math.min(Basic, 15000) * 0.12`
  - Employee State Insurance (ESI): `Gross Earnings <= 21000 ? Gross Earnings * 0.0075 : 0`
  - Net Pay: `Gross Earnings - (PF + ESI + Professional Tax + TDS + Loan Deduction)`.

### 12. Statistical Process Control (SPC)
- **Files**:
  - `src/components/quality/SpcStatisticalProcessControlView.tsx`
- **Key Formulas / Rules**:
  - Subgroup Mean: `X̄ = sum(X_i) / n`
  - Subgroup Range: `R = max(X) - min(X)`
  - Grand Mean: `X̿ = sum(X̄) / k`
  - Upper Control Limit: `UCL = X̿ + A2 * R̄`
  - Lower Control Limit: `LCL = X̿ - A2 * R̄`
  - Process Capability: `Cp = (USL - LSL) / (6 * σ)`, `Cpk = min((USL - X̿)/(3*σ), (X̿ - LSL)/(3*σ))`.

### 13. Master Data Governance & Shot Weight Coercion
- **Files**:
  - `src/services/masterDataGovernanceService.ts`
  - `src/shared/utils/dtoMappers.ts`
- **Key Formulas / Rules**:
  - Resin Blend Balance: `sum(materialPercentage) === 100% ± 0.05%`
  - Total Shot Weight: `shotWeight = Number((partWeight + runnerWeight).toFixed(2))`.

---

## 2. Next Step: Golden Tests Generation
Upon confirmation of this inventory, standalone Vitest characterization test suites will be generated in `tests/characterization/` with sample input datasets, executing each calculation and freezing their outputs into `tests/golden/*.json`.
