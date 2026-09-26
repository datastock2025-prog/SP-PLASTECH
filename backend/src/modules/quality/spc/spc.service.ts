import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';

export interface SpcSubgroup {
  subgroupId: string;
  timestamp: string;
  measurements: number[]; // e.g. 5 samples per subgroup
}

export interface SpcAnalysisResult {
  grandMean: number; // X-double-bar
  meanRange: number; // R-bar
  estimatedSigma: number;
  controlLimits: {
    uclX: number;
    lclX: number;
    uclR: number;
    lclR: number;
  };
  capabilityIndices: {
    cp: number;
    cpk: number;
    cpu: number;
    cpl: number;
    pp?: number;
    ppk?: number;
  };
  outOfControlViolations: Array<{
    subgroupId: string;
    ruleName: string;
    description: string;
  }>;
}

@Injectable()
export class SpcService {
  private readonly logger = new Logger(SpcService.name);

  // SPC Factors table for subgroup size n=5
  private readonly A2 = new Decimal(0.577);
  private readonly D3 = new Decimal(0);
  private readonly D4 = new Decimal(2.114);
  private readonly d2 = new Decimal(2.326);

  /**
   * Compute X-bar & R Charts, Process Capability (Cp/Cpk), and Western Electric Rules
   */
  calculateSpc(
    subgroups: SpcSubgroup[],
    upperSpecLimit: number,
    lowerSpecLimit: number,
  ): SpcAnalysisResult {
    if (subgroups.length === 0) {
      throw new Error('At least one subgroup is required for SPC analysis.');
    }

    const usl = new Decimal(upperSpecLimit);
    const lsl = new Decimal(lowerSpecLimit);

    let totalMean = new Decimal(0);
    let totalRange = new Decimal(0);
    const subgroupMeans: { id: string; mean: Decimal }[] = [];
    const subgroupRanges: { id: string; range: Decimal }[] = [];

    for (const sg of subgroups) {
      if (sg.measurements.length === 0) continue;
      const decVals = sg.measurements.map((v) => new Decimal(v));
      const min = Decimal.min(...decVals);
      const max = Decimal.max(...decVals);
      const sum = decVals.reduce((acc, curr) => acc.plus(curr), new Decimal(0));
      const mean = sum.dividedBy(decVals.length);
      const range = max.minus(min);

      subgroupMeans.push({ id: sg.subgroupId, mean });
      subgroupRanges.push({ id: sg.subgroupId, range });

      totalMean = totalMean.plus(mean);
      totalRange = totalRange.plus(range);
    }

    const n = new Decimal(subgroups.length);
    const grandMean = totalMean.dividedBy(n);
    const meanRange = totalRange.dividedBy(n);

    // Control Limits
    const uclX = grandMean.plus(this.A2.times(meanRange));
    const lclX = grandMean.minus(this.A2.times(meanRange));
    const uclR = this.D4.times(meanRange);
    const lclR = this.D3.times(meanRange);

    // Estimated Within Sigma = R-bar / d2
    const sigma = meanRange.dividedBy(this.d2);

    // Capability Indices (Cp, Cpk)
    const specWidth = usl.minus(lsl);
    const cp = specWidth.dividedBy(sigma.times(6));
    const cpu = usl.minus(grandMean).dividedBy(sigma.times(3));
    const cpl = grandMean.minus(lsl).dividedBy(sigma.times(3));
    const cpk = Decimal.min(cpu, cpl);

    // Western Electric Out-of-Control Rules
    const violations: SpcAnalysisResult['outOfControlViolations'] = [];
    const oneSigma = uclX.minus(grandMean).dividedBy(3);

    subgroupMeans.forEach((sg, idx) => {
      // Rule 1: One point beyond 3-sigma (UCL/LCL)
      if (sg.mean.gt(uclX) || sg.mean.lt(lclX)) {
        violations.push({
          subgroupId: sg.id,
          ruleName: 'WECO Rule 1',
          description: `Point outside 3-sigma control limits (Value: ${sg.mean.toFixed(3)})`,
        });
      }

      // Rule 2: 9 consecutive points on same side of centerline
      if (idx >= 8) {
        const last9 = subgroupMeans.slice(idx - 8, idx + 1);
        const allAbove = last9.every((pt) => pt.mean.gt(grandMean));
        const allBelow = last9.every((pt) => pt.mean.lt(grandMean));
        if (allAbove || allBelow) {
          violations.push({
            subgroupId: sg.id,
            ruleName: 'WECO Rule 2',
            description: '9 consecutive points on the same side of the central mean',
          });
        }
      }
    });

    return {
      grandMean: grandMean.toDecimalPlaces(4).toNumber(),
      meanRange: meanRange.toDecimalPlaces(4).toNumber(),
      estimatedSigma: sigma.toDecimalPlaces(4).toNumber(),
      controlLimits: {
        uclX: uclX.toDecimalPlaces(4).toNumber(),
        lclX: lclX.toDecimalPlaces(4).toNumber(),
        uclR: uclR.toDecimalPlaces(4).toNumber(),
        lclR: lclR.toDecimalPlaces(4).toNumber(),
      },
      capabilityIndices: {
        cp: cp.toDecimalPlaces(3).toNumber(),
        cpk: cpk.toDecimalPlaces(3).toNumber(),
        cpu: cpu.toDecimalPlaces(3).toNumber(),
        cpl: cpl.toDecimalPlaces(3).toNumber(),
      },
      outOfControlViolations: violations,
    };
  }
}
