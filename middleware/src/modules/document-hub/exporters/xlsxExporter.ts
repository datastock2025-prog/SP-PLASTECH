import type { OeeReportPayload } from '../types.js';

export async function exportOeeToXlsx(payload: OeeReportPayload): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryData = [
    ['SP-PLASTECH ENTERPRISE ERP — OEE EXECUTIVE SUMMARY'],
    ['Generated At', payload.generatedAt],
    ['Report Period', `${payload.summary.period.from} to ${payload.summary.period.to}`],
    [''],
    ['Core Manufacturing KPIs', 'Metric Value', 'Unit / Standard'],
    ['Overall Plant OEE', payload.summary.overallOeePct / 100, 'Percentage (World Class: >85%)'],
    ['Average Availability', payload.summary.averageAvailabilityPct / 100, 'Percentage (Target: >90%)'],
    ['Average Performance', payload.summary.averagePerformancePct / 100, 'Percentage (Target: >95%)'],
    ['Average Quality', payload.summary.averageQualityPct / 100, 'Percentage (Target: >99.5%)'],
    [''],
    ['Hours Accounting', 'Hours', 'Comments'],
    ['Total Planned Production Hours', payload.summary.totalPlannedHours, 'Scheduled shift duration less planned meal breaks'],
    ['Total Operating Hours', payload.summary.totalOperatingHours, 'Active injection cycle execution'],
    ['Total Unplanned Downtime Hours', payload.summary.totalDowntimeHours, 'Mold breakdown, purging, material shortage, electrical fault'],
    [''],
    ['Volume & Piece Accounting', 'Count', 'Comments'],
    ['Total Pieces Produced', payload.summary.totalQty, 'Total output from all recorded shots'],
    ['Good Conforming Pieces', payload.summary.totalGoodQty, 'Passed inline quality gate'],
    ['Defective Rejections', payload.summary.totalRejectedQty, 'Sent to regrind / scrap staging'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 45 }];

  // 2. Machine Shift Detail Sheet
  const detailData = [
    [
      'Date',
      'Plant Hub',
      'Machine Code',
      'Machine Name',
      'Operating Shift',
      'Planned (Min)',
      'Downtime (Min)',
      'Operating (Min)',
      'Shots Produced',
      'Good Qty',
      'Rejected Qty',
      'Total Output',
      'Availability (%)',
      'Performance (%)',
      'Quality (%)',
      'OEE (%)',
    ],
    ...payload.rows.map((r) => [
      r.date,
      r.plantName,
      r.machineCode,
      r.machineName,
      r.shiftName,
      r.plannedMinutes,
      r.downtimeMinutes,
      r.operatingMinutes,
      r.shotsProduced,
      r.goodQty,
      r.rejectedQty,
      r.totalQty,
      r.availabilityPct,
      r.performancePct,
      r.qualityPct,
      r.oeePct,
    ]),
  ];

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  wsDetail['!cols'] = [
    { wch: 12 }, // Date
    { wch: 25 }, // Plant
    { wch: 18 }, // Machine Code
    { wch: 28 }, // Machine Name
    { wch: 22 }, // Shift
    { wch: 14 }, // Planned
    { wch: 14 }, // Downtime
    { wch: 14 }, // Operating
    { wch: 15 }, // Shots
    { wch: 12 }, // Good
    { wch: 12 }, // Rej
    { wch: 14 }, // Total
    { wch: 16 }, // Avail %
    { wch: 16 }, // Perf %
    { wch: 14 }, // Qual %
    { wch: 12 }, // OEE %
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Shift Detail');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}
