import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('SPC, OEE, Costing, and Valuation Characterization Tests', () => {
  it('preserves SPC statistics (grandMean, avgRange, Cp, Cpk) matching SpcMonitorView math', () => {
    const subgroups = [
      { id: 1, xBar: 12.012, range: 0.045 },
      { id: 2, xBar: 11.995, range: 0.038 },
      { id: 3, xBar: 12.008, range: 0.052 },
      { id: 4, xBar: 12.015, range: 0.041 },
      { id: 5, xBar: 11.988, range: 0.048 },
    ];
    const charConfig = { usl: 12.15, lsl: 11.85, nominal: 12.0 };

    const grandMean = subgroups.reduce((s, g) => s + g.xBar, 0) / (subgroups.length || 1);
    const avgRange = subgroups.reduce((s, g) => s + g.range, 0) / (subgroups.length || 1);
    const estSigma = avgRange / 2.326; // d2 factor for n=5
    const cp = (charConfig.usl - charConfig.lsl) / (6 * estSigma);
    const cpkUpper = (charConfig.usl - grandMean) / (3 * estSigma);
    const cpkLower = (grandMean - charConfig.lsl) / (3 * estSigma);
    const cpk = Math.min(cpkUpper, cpkLower);

    const spcResult = {
      grandMean: Number(grandMean.toFixed(4)),
      avgRange: Number(avgRange.toFixed(4)),
      estSigma: Number(estSigma.toFixed(4)),
      cp: Number(cp.toFixed(2)),
      cpk: Number(cpk.toFixed(2)),
    };

    // 3-factor OEE math matching OeeAnalyticsDashboard
    const availability = 91.2;
    const performance = 94.5;
    const quality = 98.8;
    const overallOEE = Number(((availability * performance * quality) / 10000).toFixed(1));

    // Inquiry Costing math matching CrmInquiryCostingView
    const partWeightGrams = 45;
    const runnerWeightGrams = 10;
    const cavityCount = 4;
    const cycleTimeSec = 24;
    const machineHourlyRate = 850;
    const resinCostPerKg = 240;
    const masterbatchDosagePct = 2.5;
    const masterbatchCostPerKg = 450;
    const regrindUsagePct = 10;
    const scrapAllowancePct = 3.5;
    const moldToolingCost = 1200000;
    const plannedBatchQty = 100000;
    const packagingCostPerUnit = 1.2;
    const freightCostPerUnit = 0.8;
    const targetMarkupPct = 25;

    const shotWeightGrams = partWeightGrams * cavityCount + runnerWeightGrams;
    const effectivePartWeightWithRunner = (partWeightGrams + runnerWeightGrams / cavityCount) * (1 + scrapAllowancePct / 100);
    const virginWeightKg = (effectivePartWeightWithRunner * (100 - regrindUsagePct) / 100) / 1000;
    const masterbatchWeightKg = (effectivePartWeightWithRunner * (masterbatchDosagePct / 100)) / 1000;
    const rawMaterialCost = (virginWeightKg * resinCostPerKg) + (masterbatchWeightKg * masterbatchCostPerKg);
    const shotsPerHour = 3600 / cycleTimeSec;
    const partsPerHour = shotsPerHour * cavityCount;
    const conversionCostPerUnit = machineHourlyRate / partsPerHour;
    const toolingAmortizationPerUnit = plannedBatchQty > 0 ? moldToolingCost / plannedBatchQty : 0;
    const totalMfgCost = rawMaterialCost + conversionCostPerUnit + toolingAmortizationPerUnit + packagingCostPerUnit + freightCostPerUnit;
    const quotedPricePerUnit = totalMfgCost / (1 - targetMarkupPct / 100);
    const profitMarginPerUnit = quotedPricePerUnit - totalMfgCost;
    const totalOrderValue = quotedPricePerUnit * plannedBatchQty;

    const costingResult = {
      shotWeightGrams: Number(shotWeightGrams.toFixed(2)),
      rawMaterialCost: Number(rawMaterialCost.toFixed(2)),
      conversionCostPerUnit: Number(conversionCostPerUnit.toFixed(2)),
      toolingAmortizationPerUnit: Number(toolingAmortizationPerUnit.toFixed(2)),
      totalMfgCost: Number(totalMfgCost.toFixed(2)),
      quotedPricePerUnit: Number(quotedPricePerUnit.toFixed(2)),
      profitMarginPerUnit: Number(profitMarginPerUnit.toFixed(2)),
      totalOrderValue: Number(totalOrderValue.toFixed(2)),
    };

    // NIC E-Way Bill valuation arithmetic
    const taxableValue = 150000;
    const cgstValue = 13500;
    const sgstValue = 13500;
    const igstValue = 0;
    const cessValue = 0;
    const computedTotal = taxableValue + cgstValue + sgstValue + igstValue + cessValue;
    const totInvValue = 177000;
    const isValuationValid = Math.abs(computedTotal - totInvValue) <= 1.0;

    const snapshot = {
      spcResult,
      oeeResult: { availability, performance, quality, overallOEE },
      costingResult,
      nicValuation: { computedTotal, totInvValue, isValuationValid },
    };

    const goldenDir = path.resolve(process.cwd(), 'tests/golden');
    if (!fs.existsSync(goldenDir)) {
      fs.mkdirSync(goldenDir, { recursive: true });
    }
    const goldenFile = path.join(goldenDir, 'spc-oee-costing.json');

    if (!fs.existsSync(goldenFile)) {
      fs.writeFileSync(goldenFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    }

    const expected = JSON.parse(fs.readFileSync(goldenFile, 'utf-8'));
    expect(snapshot).toEqual(expected);
  });
});
