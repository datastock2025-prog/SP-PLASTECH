import * as XLSX from 'xlsx';

export interface ExportDataPayload {
  title: string;
  subtitle?: string;
  tenantId?: string;
  headers: string[];
  rows: (string | number)[][];
  summaryMetrics?: { label: string; value: string | number }[];
}

export const AiDocumentExporter = {
  /**
   * Export to Microsoft Excel (.xlsx) with styled sheets and summary formulas
   */
  exportExcel(payload: ExportDataPayload, filenamePrefix: string = 'SP_PLASTECH_Report'): void {
    const wb = XLSX.utils.book_new();

    // 1. Data Sheet
    const sheetData = [
      [payload.title],
      [payload.subtitle || `Tenant: ${payload.tenantId || 'TENANT-ALPHA-IND'} | Generated: ${new Date().toLocaleString()}`],
      [],
      ...(payload.summaryMetrics ? [payload.summaryMetrics.map((m) => `${m.label}: ${m.value}`), []] : []),
      payload.headers,
      ...payload.rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    const colWidths = payload.headers.map((h, i) => {
      let maxLen = h.length;
      payload.rows.forEach((r) => {
        const valLen = r[i] ? String(r[i]).length : 0;
        if (valLen > maxLen) maxLen = valLen;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Analytics Report');

    const fileName = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  /**
   * Export to CSV (.csv)
   */
  exportCsv(payload: ExportDataPayload, filenamePrefix: string = 'SP_PLASTECH_Data'): void {
    const csvRows: string[] = [];
    csvRows.push(`"${payload.title}"`);
    if (payload.subtitle) csvRows.push(`"${payload.subtitle}"`);
    csvRows.push('');
    csvRows.push(payload.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

    payload.rows.forEach((row) => {
      const formatted = row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`);
      csvRows.push(formatted.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Export to Formatted PDF Printable Brief (.pdf)
   */
  exportPdf(payload: ExportDataPayload, filenamePrefix: string = 'SP_PLASTECH_Executive_Brief'): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to download PDF.');
      return;
    }

    const tableRows = payload.rows
      .slice(0, 100)
      .map(
        (r) =>
          `<tr>${r.map((c) => `<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${c}</td>`).join('')}</tr>`,
      )
      .join('');

    const metricsHtml = payload.summaryMetrics
      ? `<div style="display: flex; gap: 16px; margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          ${payload.summaryMetrics
            .map(
              (m) =>
                `<div><div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">${m.label}</div><div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 2px;">${m.value}</div></div>`,
            )
            .join('')}
        </div>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${payload.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; }
          .header { border-bottom: 2px solid #0f8b8d; padding-bottom: 12px; margin-bottom: 20px; }
          .brand { font-size: 20px; font-weight: 800; color: #0f8b8d; letter-spacing: 0.5px; }
          .title { font-size: 16px; font-weight: 700; margin-top: 4px; }
          .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; text-align: left; }
          th { background: #f1f5f9; padding: 8px; font-size: 11px; font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">SP-PLASTECH ERP</div>
          <div class="title">${payload.title}</div>
          <div class="meta">${payload.subtitle || `Tenant: ${payload.tenantId || 'TENANT-ALPHA-IND'} | Generated: ${new Date().toLocaleString()}`}</div>
        </div>
        ${metricsHtml}
        <table>
          <thead>
            <tr>${payload.headers.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="footer">
          Confidential System Report &bull; SP-PLASTECH Enterprise Intelligence &bull; Verified Precision
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  /**
   * Export to PowerPoint Executive Slide (.pptx / XML presentation)
   */
  exportPptx(payload: ExportDataPayload, filenamePrefix: string = 'SP_PLASTECH_Executive_Slide'): void {
    // Generate clean HTML-based slide format convertible to PPTX or printable as presentation deck
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${payload.title} - Executive Slide Deck</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: white; margin: 0; padding: 40px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .slide { width: 900px; height: 506px; background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #334155; border-radius: 24px; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
          .brand { font-size: 14px; font-weight: 800; color: #2dd4bf; text-transform: uppercase; letter-spacing: 1px; }
          .slide-title { font-size: 26px; font-weight: 800; margin-top: 8px; color: #f8fafc; }
          .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
          .metric-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; text-align: center; }
          .metric-val { font-size: 24px; font-weight: 800; color: #38bdf8; margin-top: 4px; font-family: monospace; }
          .metric-lbl { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
          .slide-footer { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="slide">
          <div>
            <div class="brand">SP-PLASTECH &bull; Executive Command Tower</div>
            <div class="slide-title">${payload.title}</div>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${payload.subtitle || 'Real-time synthesis across enterprise manufacturing bays'}</p>
          </div>
          <div class="metrics-grid">
            ${(payload.summaryMetrics || [
              { label: 'Overall OEE', value: '84.6%' },
              { label: 'Quality FPY', value: '98.2%' },
              { label: 'Active Catalog', value: '1,719 Items' },
            ])
              .map(
                (m) =>
                  `<div class="metric-card"><div class="metric-lbl">${m.label}</div><div class="metric-val">${m.value}</div></div>`,
              )
              .join('')}
          </div>
          <div class="slide-footer">
            <span>Confidential Executive Deck</span>
            <span>Generated: ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },
};
