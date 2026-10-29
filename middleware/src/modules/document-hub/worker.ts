import crypto from 'crypto';
import { getDrizzle, schema } from '../../db.js';
import { eq, and } from 'drizzle-orm';
import { documentReportJobs, generatedDocuments } from '../../schema/documentHub.js';
import { fetchOeeProductionSlices } from './reports/oeeQuery.js';
import { buildOeeReportPayload } from './reports/oeeCalculator.js';
import { exportOeeToCsv } from './exporters/csvExporter.js';
import { exportOeeToXlsx } from './exporters/xlsxExporter.js';
import { exportOeeToPdf } from './exporters/pdfExporter.js';
import { getDocumentStorage } from './storage.js';
import type { OeeReportFilters } from './types.js';

export async function processReportJob(jobId: string, tenantId: string): Promise<void> {
  const db = getDrizzle();
  const startTime = Date.now();

  // 1. Mark status as PROCESSING
  await db
    .update(documentReportJobs)
    .set({
      status: 'PROCESSING',
      startedAt: new Date(),
      attemptCount: 1,
    })
    .where(and(eq(documentReportJobs.id, jobId), eq(documentReportJobs.tenantId, tenantId)));

  try {
    // 2. Fetch the job details
    const jobs = await db
      .select()
      .from(documentReportJobs)
      .where(and(eq(documentReportJobs.id, jobId), eq(documentReportJobs.tenantId, tenantId)))
      .limit(1);

    if (jobs.length === 0) {
      throw new Error(`Report job ${jobId} not found`);
    }

    const job = jobs[0];
    const filters = (job.filters || {}) as OeeReportFilters;

    let buffer: Buffer;
    let mimeType: string;
    let ext: string;
    let rowCount = 0;

    if (job.reportType === 'OEE_PERFORMANCE' || job.reportType === 'OEE') {
      const dateFrom = filters.dateFrom || new Date().toISOString().slice(0, 10);
      const dateTo = filters.dateTo || dateFrom;

      const slices = await fetchOeeProductionSlices(
        { tenantId, userId: job.requestedBy },
        { ...filters, dateFrom, dateTo }
      );

      const payload = buildOeeReportPayload(slices, dateFrom, dateTo);
      rowCount = payload.rows.length;

      if (job.outputFormat === 'CSV') {
        buffer = exportOeeToCsv(payload);
        mimeType = 'text/csv';
        ext = 'csv';
      } else if (job.outputFormat === 'XLSX') {
        buffer = await exportOeeToXlsx(payload);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        ext = 'xlsx';
      } else {
        buffer = await exportOeeToPdf(payload);
        mimeType = 'application/pdf';
        ext = 'pdf';
      }
    } else {
      throw new Error(`Unsupported report type: ${job.reportType}`);
    }

    // 3. Store file securely
    const storage = getDocumentStorage();
    const storageKey = `${tenantId}/${job.reportType.toLowerCase()}/${jobId}.${ext}`;
    const fileName = `${job.reportType}_${filters.dateFrom || 'report'}_${Date.now()}.${ext}`;
    const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    await storage.saveFile(storageKey, buffer, {
      mimeType,
      fileName,
    });

    // 4. Record generated document
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 day retention
    await db.insert(generatedDocuments).values({
      tenantId,
      jobId,
      ownerUserId: job.requestedBy,
      storageProvider: 'local',
      storageKey,
      fileName,
      mimeType,
      fileSizeBytes: buffer.length,
      checksumSha256,
      expiresAt,
    });

    // 5. Update job status to COMPLETED
    const durationMs = Date.now() - startTime;
    await db
      .update(documentReportJobs)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        durationMs,
        rowCount,
      })
      .where(and(eq(documentReportJobs.id, jobId), eq(documentReportJobs.tenantId, tenantId)));

    console.log(`[DocumentHub Worker] Job ${jobId} completed successfully (${buffer.length} bytes, ${durationMs}ms)`);
  } catch (err: any) {
    console.error(`[DocumentHub Worker] Job ${jobId} failed:`, err);
    const durationMs = Date.now() - startTime;
    await db
      .update(documentReportJobs)
      .set({
        status: 'FAILED',
        completedAt: new Date(),
        durationMs,
        errorCode: 'GENERATION_ERROR',
        errorSummary: err?.message || 'Document generation failed',
      })
      .where(and(eq(documentReportJobs.id, jobId), eq(documentReportJobs.tenantId, tenantId)))
      .catch(() => {});
    throw err;
  }
}
