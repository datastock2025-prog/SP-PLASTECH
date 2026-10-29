import type { OeeReportPayload } from '../types.js';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Formula injection prevention
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Double quote escaping
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportOeeToCsv(payload: OeeReportPayload): Buffer {
  const lines: string[] = [];

  // Metadata headers
  lines.push(`${escapeCsvField('SP-PLASTECH ERP — Overall Equipment Effectiveness (OEE) Report')}`);
  lines.push(`${escapeCsvField('Generated At')},${escapeCsvField(payload.generatedAt)}`);
  lines.push(`${escapeCsvField('Period From')},${escapeCsvField(payload.summary.period.from)},${escapeCsvField('Period To')},${escapeCsvField(payload.summary.period.to)}`);
  lines.push(`${escapeCsvField('Overall OEE (%)')},${escapeCsvField(payload.summary.overallOeePct)},${escapeCsvField('Avg Availability (%)')},${escapeCsvField(payload.summary.averageAvailabilityPct)},${escapeCsvField('Avg Performance (%)')},${escapeCsvField(payload.summary.averagePerformancePct)},${escapeCsvField('Avg Quality (%)')},${escapeCsvField(payload.summary.averageQualityPct)}`);
  lines.push(`${escapeCsvField('Total Planned Hours')},${escapeCsvField(payload.summary.totalPlannedHours)},${escapeCsvField('Total Operating Hours')},${escapeCsvField(payload.summary.totalOperatingHours)},${escapeCsvField('Total Downtime Hours')},${escapeCsvField(payload.summary.totalDowntimeHours)}`);
  lines.push(`${escapeCsvField('Total Output (Units)')},${escapeCsvField(payload.summary.totalQty)},${escapeCsvField('Good Qty')},${escapeCsvField(payload.summary.totalGoodQty)},${escapeCsvField('Rejected Qty')},${escapeCsvField(payload.summary.totalRejectedQty)}`);
  lines.push(''); // Blank spacer

  // Table Column Headers
  const headers = [
    'Date',
    'Plant',
    'Machine Code',
    'Machine Name',
    'Shift',
    'Planned (Min)',
    'Downtime (Min)',
    'Operating (Min)',
    'Shots Produced',
    'Good Qty',
    'Rejected Qty',
    'Total Qty',
    'Availability (%)',
    'Performance (%)',
    'Quality (%)',
    'OEE (%)',
  ];
  lines.push(headers.map(escapeCsvField).join(','));

  // Data Rows
  for (const row of payload.rows) {
    const rowValues = [
      row.date,
      row.plantName,
      row.machineCode,
      row.machineName,
      row.shiftName,
      row.plannedMinutes,
      row.downtimeMinutes,
      row.operatingMinutes,
      row.shotsProduced,
      row.goodQty,
      row.rejectedQty,
      row.totalQty,
      row.availabilityPct,
      row.performancePct,
      row.qualityPct,
      row.oeePct,
    ];
    lines.push(rowValues.map(escapeCsvField).join(','));
  }

  return Buffer.from(lines.join('\r\n'), 'utf-8');
}

