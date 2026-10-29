import type { OeeReportPayload } from '../types.js';

export async function exportOeeToPdf(payload: OeeReportPayload): Promise<Buffer> {
  const { default: PDFDocument } = await import('pdfkit');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 36, bottom: 36, left: 36, right: 36 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: unknown) => reject(err));

      // Brand Color Palette
      const primaryColor = '#0F8B8D';
      const darkColor = '#0F172A';
      const textMuted = '#64748B';
      const cardBg = '#F8FAFC';
      const borderLine = '#E2E8F0';

      // 1. Header Banner
      doc.rect(36, 36, 770, 50).fill('#F1F5F9');
      doc.rect(36, 36, 6, 50).fill(primaryColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(darkColor)
        .text('SP-PLASTECH ERP — OEE Performance Audit Report', 52, 46);

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(textMuted)
        .text(
          `Report Period: ${payload.summary.period.from} to ${payload.summary.period.to}   |   Generated: ${new Date(payload.generatedAt).toLocaleString('en-IN')}`,
          52,
          68
        );

      // 2. KPI Summary Cards (4 Cards)
      const kpis = [
        { label: 'Overall OEE', val: `${payload.summary.overallOeePct}%`, color: '#0F8B8D', sub: 'Target > 85%' },
        { label: 'Availability', val: `${payload.summary.averageAvailabilityPct}%`, color: '#2563EB', sub: 'Target > 90%' },
        { label: 'Performance', val: `${payload.summary.averagePerformancePct}%`, color: '#7C3AED', sub: 'Target > 95%' },
        { label: 'Quality Rate', val: `${payload.summary.averageQualityPct}%`, color: '#059669', sub: 'Target > 99%' },
      ];

      const cardWidth = 185;
      const cardHeight = 52;
      const cardY = 96;

      kpis.forEach((kpi, idx) => {
        const cardX = 36 + idx * (cardWidth + 10);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6).fillAndStroke(cardBg, borderLine);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMuted)
          .text(kpi.label.toUpperCase(), cardX + 12, cardY + 8);

        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .fillColor(kpi.color)
          .text(kpi.val, cardX + 12, cardY + 20);

        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(textMuted)
          .text(kpi.sub, cardX + 115, cardY + 26, { width: 60, align: 'right' });
      });

      // 3. Table Headers
      let tableY = 160;
      doc.rect(36, tableY, 770, 22).fill(primaryColor);

      const columns = [
        { title: 'Date', x: 44, w: 65, align: 'left' as const },
        { title: 'Plant / Facility', x: 110, w: 100, align: 'left' as const },
        { title: 'Machine Code', x: 215, w: 85, align: 'left' as const },
        { title: 'Shift', x: 305, w: 75, align: 'left' as const },
        { title: 'Planned', x: 385, w: 45, align: 'right' as const },
        { title: 'Down', x: 435, w: 40, align: 'right' as const },
        { title: 'Operating', x: 480, w: 45, align: 'right' as const },
        { title: 'Shots', x: 530, w: 45, align: 'right' as const },
        { title: 'Good', x: 580, w: 45, align: 'right' as const },
        { title: 'Rej', x: 630, w: 35, align: 'right' as const },
        { title: 'Avail %', x: 670, w: 42, align: 'right' as const },
        { title: 'Perf %', x: 715, w: 42, align: 'right' as const },
        { title: 'OEE %', x: 760, w: 42, align: 'right' as const },
      ];

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
      columns.forEach((col) => {
        doc.text(col.title, col.x, tableY + 6, { width: col.w, align: col.align });
      });

      tableY += 22;

      // 4. Table Rows
      const rowHeight = 16;
      payload.rows.forEach((row, rowIndex) => {
        // Page break if bottom margin reached
        if (tableY + rowHeight > 540) {
          doc.addPage();
          tableY = 36;
          // Repeat table header on new page
          doc.rect(36, tableY, 770, 20).fill(primaryColor);
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
          columns.forEach((col) => {
            doc.text(col.title, col.x, tableY + 5, { width: col.w, align: col.align });
          });
          tableY += 20;
        }

        const isEven = rowIndex % 2 === 0;
        doc.rect(36, tableY, 770, rowHeight).fill(isEven ? '#FFFFFF' : '#F8FAFC');

        doc.font('Helvetica').fontSize(7.5).fillColor(darkColor);

        doc.text(row.date, columns[0].x, tableY + 4, { width: columns[0].w, align: columns[0].align });
        doc.text(row.plantName.slice(0, 16), columns[1].x, tableY + 4, { width: columns[1].w, align: columns[1].align });
        doc.text(row.machineCode, columns[2].x, tableY + 4, { width: columns[2].w, align: columns[2].align });
        doc.text(row.shiftName.slice(0, 14), columns[3].x, tableY + 4, { width: columns[3].w, align: columns[3].align });
        doc.text(`${row.plannedMinutes}m`, columns[4].x, tableY + 4, { width: columns[4].w, align: columns[4].align });
        doc.text(`${row.downtimeMinutes}m`, columns[5].x, tableY + 4, { width: columns[5].w, align: columns[5].align });
        doc.text(`${row.operatingMinutes}m`, columns[6].x, tableY + 4, { width: columns[6].w, align: columns[6].align });
        doc.text(row.shotsProduced.toLocaleString(), columns[7].x, tableY + 4, { width: columns[7].w, align: columns[7].align });
        doc.text(row.goodQty.toLocaleString(), columns[8].x, tableY + 4, { width: columns[8].w, align: columns[8].align });
        doc.text(row.rejectedQty.toLocaleString(), columns[9].x, tableY + 4, { width: columns[9].w, align: columns[9].align });
        doc.text(`${row.availabilityPct}%`, columns[10].x, tableY + 4, { width: columns[10].w, align: columns[10].align });
        doc.text(`${row.performancePct}%`, columns[11].x, tableY + 4, { width: columns[11].w, align: columns[11].align });

        // Highlight OEE in bold
        doc
          .font('Helvetica-Bold')
          .fillColor(row.oeePct >= 85 ? '#059669' : row.oeePct >= 65 ? '#D97706' : '#DC2626')
          .text(`${row.oeePct}%`, columns[12].x, tableY + 4, { width: columns[12].w, align: columns[12].align });

        tableY += rowHeight;
      });

      // 5. Footer with Page Numbers
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.rect(36, 560, 770, 0.5).stroke('#CBD5E1');
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMuted)
          .text('SP-PLASTECH ERP — Confidential & Proprietary Manufacturing Intelligence', 36, 568);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMuted)
          .text(`Page ${i + 1} of ${totalPages}`, 700, 568, { width: 106, align: 'right' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
