import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';

export interface EprCreditCalculation {
  tenantId: string;
  period: string; // e.g. "2026-Q1"
  category: 'CAT_I_RIGID' | 'CAT_II_FLEXIBLE' | 'CAT_III_MULTILAYER';
  totalPlasticIntroducedKg: number | Decimal;
  recycledPlasticUsedKg: number | Decimal;
  mandatoryRecyclingTargetPct: number | Decimal; // e.g. 30%
  deficitOrSurplusKg: number;
  liabilityInr: number;
}

export interface EnergyEfficiencyMetrics {
  machineId: string;
  shiftDate: string;
  shiftNumber: 1 | 2 | 3;
  totalKwhConsumed: number | Decimal;
  producedWeightKg: number | Decimal;
  kwhPerKg: number;
  energyCostPerKgInr: number;
}

export interface RegrindMixRatioValidation {
  bomVirginRatioPct: number;
  bomRegrindRatioPct: number;
  actualVirginKg: number | Decimal;
  actualRegrindKg: number | Decimal;
  actualRegrindPct: number;
  isWithinTolerance: boolean;
  variancePct: number;
}

@Injectable()
export class SustainabilityService {
  private readonly logger = new Logger(SustainabilityService.name);

  // Government EPR penalty per kg deficit (INR)
  private readonly eprPenaltyPerKg = new Decimal(5.0); // ₹5.00 / kg

  /**
   * Calculate Extended Producer Responsibility (EPR) Credit Liability
   */
  calculateEprLiability(params: {
    tenantId: string;
    period: string;
    category: EprCreditCalculation['category'];
    totalPlasticIntroducedKg: number | Decimal;
    recycledPlasticUsedKg: number | Decimal;
    mandatoryRecyclingTargetPct?: number | Decimal;
  }): EprCreditCalculation {
    const totalIntroduced = new Decimal(params.totalPlasticIntroducedKg);
    const recycledUsed = new Decimal(params.recycledPlasticUsedKg);
    const targetPct = new Decimal(params.mandatoryRecyclingTargetPct || 30);

    const requiredRecycledKg = totalIntroduced.times(targetPct).dividedBy(100);
    const deficitKg = requiredRecycledKg.minus(recycledUsed);

    const liabilityInr = deficitKg.gt(0)
      ? deficitKg.times(this.eprPenaltyPerKg).toDecimalPlaces(2).toNumber()
      : 0;

    return {
      tenantId: params.tenantId,
      period: params.period,
      category: params.category,
      totalPlasticIntroducedKg: totalIntroduced.toNumber(),
      recycledPlasticUsedKg: recycledUsed.toNumber(),
      mandatoryRecyclingTargetPct: targetPct.toNumber(),
      deficitOrSurplusKg: deficitKg.negated().toDecimalPlaces(2).toNumber(), // Positive = surplus, Negative = deficit
      liabilityInr,
    };
  }

  /**
   * Compute Machine Energy Efficiency (kWh / kg of plastic produced)
   */
  calculateEnergyEfficiency(
    machineId: string,
    shiftDate: string,
    shiftNumber: 1 | 2 | 3,
    totalKwhConsumed: number | Decimal,
    producedWeightKg: number | Decimal,
    costPerKwhInr: number | Decimal = 8.5,
  ): EnergyEfficiencyMetrics {
    const kwh = new Decimal(totalKwhConsumed);
    const weightKg = new Decimal(producedWeightKg);
    const rate = new Decimal(costPerKwhInr);

    if (weightKg.lte(0)) {
      return {
        machineId,
        shiftDate,
        shiftNumber,
        totalKwhConsumed: kwh.toNumber(),
        producedWeightKg: 0,
        kwhPerKg: 0,
        energyCostPerKgInr: 0,
      };
    }

    const kwhPerKg = kwh.dividedBy(weightKg);
    const energyCostPerKg = kwhPerKg.times(rate);

    return {
      machineId,
      shiftDate,
      shiftNumber,
      totalKwhConsumed: kwh.toNumber(),
      producedWeightKg: weightKg.toNumber(),
      kwhPerKg: kwhPerKg.toDecimalPlaces(3).toNumber(),
      energyCostPerKgInr: energyCostPerKg.toDecimalPlaces(2).toNumber(),
    };
  }

  /**
   * Validate Virgin vs. Regrind mix ratio against BOM specification
   */
  validateRegrindMix(
    bomRegrindPct: number,
    actualVirginKg: number | Decimal,
    actualRegrindKg: number | Decimal,
    allowedTolerancePct: number = 5.0,
  ): RegrindMixRatioValidation {
    const virgin = new Decimal(actualVirginKg);
    const regrind = new Decimal(actualRegrindKg);
    const total = virgin.plus(regrind);

    if (total.lte(0)) {
      return {
        bomVirginRatioPct: 100 - bomRegrindPct,
        bomRegrindRatioPct: bomRegrindPct,
        actualVirginKg: 0,
        actualRegrindKg: 0,
        actualRegrindPct: 0,
        isWithinTolerance: true,
        variancePct: 0,
      };
    }

    const actualRegrindPct = regrind.dividedBy(total).times(100);
    const bomRegrind = new Decimal(bomRegrindPct);
    const variance = actualRegrindPct.minus(bomRegrind).abs();

    const isWithinTolerance = variance.lte(allowedTolerancePct);

    return {
      bomVirginRatioPct: 100 - bomRegrindPct,
      bomRegrindRatioPct: bomRegrindPct,
      actualVirginKg: virgin.toNumber(),
      actualRegrindKg: regrind.toNumber(),
      actualRegrindPct: actualRegrindPct.toDecimalPlaces(2).toNumber(),
      isWithinTolerance,
      variancePct: variance.toDecimalPlaces(2).toNumber(),
    };
  }
}
