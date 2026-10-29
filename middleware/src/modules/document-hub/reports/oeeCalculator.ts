import {
  RawOeeProductionSlice,
  CalculatedOeeRecord,
  OeeReportSummary,
  OeeReportPayload,
} from '../types.js';

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateOeeSlice(slice: RawOeeProductionSlice): CalculatedOeeRecord {
  const plannedMinutes = Math.max(0, slice.shiftPlannedMinutes);
  const downtimeMinutes = Math.min(plannedMinutes, Math.max(0, slice.downtimeMinutes));
  const operatingMinutes = Math.max(0, plannedMinutes - downtimeMinutes);
  const operatingSeconds = operatingMinutes * 60;

  // 1. Availability = Operating Time / Planned Production Time
  let availability = 0;
  if (plannedMinutes > 0) {
    availability = operatingMinutes / plannedMinutes;
  }
  availability = Math.min(1, Math.max(0, availability));

  // 2. Performance = (Ideal Cycle Time * Total Shots) / Operating Time in Seconds
  let performance = 0;
  if (operatingSeconds > 0 && slice.idealCycleTimeSeconds > 0) {
    const idealOperatingSeconds = slice.idealCycleTimeSeconds * slice.shotsProduced;
    performance = idealOperatingSeconds / operatingSeconds;
  }
  performance = Math.min(1, Math.max(0, performance));

  // 3. Quality = Good Qty / Total Qty Produced
  const totalQty = Math.max(0, slice.goodQty + slice.rejectedQty);
  let quality = 0;
  if (totalQty > 0) {
    quality = Math.max(0, slice.goodQty) / totalQty;
  } else if (operatingMinutes === 0 && slice.rejectedQty === 0) {
    quality = 1.0;
  }
  quality = Math.min(1, Math.max(0, quality));

  // 4. OEE = Availability * Performance * Quality
  const oee = availability * performance * quality;

  return {
    sliceKey: slice.sliceKey,
    date: slice.date,
    plantName: slice.plantName || 'Plant 01',
    machineCode: slice.machineCode,
    machineName: slice.machineName,
    shiftName: slice.shiftName,
    plannedMinutes: round2(plannedMinutes),
    downtimeMinutes: round2(downtimeMinutes),
    operatingMinutes: round2(operatingMinutes),
    shotsProduced: slice.shotsProduced,
    goodQty: slice.goodQty,
    rejectedQty: slice.rejectedQty,
    totalQty,
    availability: round2(availability),
    performance: round2(performance),
    quality: round2(quality),
    oee: round2(oee),
    availabilityPct: round2(availability * 100),
    performancePct: round2(performance * 100),
    qualityPct: round2(quality * 100),
    oeePct: round2(oee * 100),
  };
}

export function buildOeeReportPayload(
  slices: RawOeeProductionSlice[],
  dateFrom: string,
  dateTo: string
): OeeReportPayload {
  const rows = slices.map(calculateOeeSlice);

  let sumPlannedMinutes = 0;
  let sumOperatingMinutes = 0;
  let sumDowntimeMinutes = 0;
  let sumGoodQty = 0;
  let sumRejectedQty = 0;
  let sumIdealOperatingSeconds = 0;

  for (const s of slices) {
    const planned = Math.max(0, s.shiftPlannedMinutes);
    const downtime = Math.min(planned, Math.max(0, s.downtimeMinutes));
    const operating = Math.max(0, planned - downtime);

    sumPlannedMinutes += planned;
    sumDowntimeMinutes += downtime;
    sumOperatingMinutes += operating;
    sumGoodQty += Math.max(0, s.goodQty);
    sumRejectedQty += Math.max(0, s.rejectedQty);
    sumIdealOperatingSeconds += s.idealCycleTimeSeconds * s.shotsProduced;
  }

  const totalQty = sumGoodQty + sumRejectedQty;
  const overallAvailability = sumPlannedMinutes > 0 ? sumOperatingMinutes / sumPlannedMinutes : 0;
  const totalOperatingSeconds = sumOperatingMinutes * 60;
  const overallPerformance =
    totalOperatingSeconds > 0 ? Math.min(1, sumIdealOperatingSeconds / totalOperatingSeconds) : 0;
  const overallQuality = totalQty > 0 ? sumGoodQty / totalQty : 1.0;
  const overallOee = overallAvailability * overallPerformance * overallQuality;

  const summary: OeeReportSummary = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    totalSlices: rows.length,
    totalPlannedHours: round2(sumPlannedMinutes / 60),
    totalOperatingHours: round2(sumOperatingMinutes / 60),
    totalDowntimeHours: round2(sumDowntimeMinutes / 60),
    totalGoodQty: sumGoodQty,
    totalRejectedQty: sumRejectedQty,
    totalQty,
    averageAvailabilityPct: round2(overallAvailability * 100),
    averagePerformancePct: round2(overallPerformance * 100),
    averageQualityPct: round2(overallQuality * 100),
    overallOeePct: round2(overallOee * 100),
  };

  return {
    summary,
    rows,
    generatedAt: new Date().toISOString(),
  };
}

