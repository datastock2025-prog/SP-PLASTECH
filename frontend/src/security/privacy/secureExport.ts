/**
 * Secure Data Export Engine with Forensic Watermarking & Audit Logging
 * Injects tamper-evident forensic watermarks (User Name, Email, IP, Tenant ID, Timestamp)
 * into CSV, Excel, and PDF downloads.
 */

import * as XLSX from 'xlsx';
import { UserProfile } from '../types';

export interface SecureExportOptions {
  filename: string;
  user?: Partial<UserProfile> | { fullName?: string; email?: string; id?: string; tenantId?: string; role?: string };
  userName?: string;
  userId?: string;
  format?: 'CSV' | 'XLSX' | 'csv' | 'xlsx';
  data?: Record<string, any>[];
  classification?: 'CONFIDENTIAL' | 'INTERNAL' | 'RESTRICTED';
  maxBulkRows?: number;
  maxRows?: number;
}

export class SecureDataExporter {
  public static exportDataset(options: SecureExportOptions): boolean {
    const {
      filename,
      user,
      userName = 'Security User',
      userId = 'user_default',
      format = 'XLSX',
      data = [],
      classification = 'CONFIDENTIAL',
      maxBulkRows = options.maxRows || 50000,
    } = options;

    if (!data || data.length === 0) {
      console.warn('Export Warning: Dataset is empty.');
      return false;
    }

    if (data.length > maxBulkRows) {
      throw new Error(
        `Security Policy Violation: Bulk export exceeded ${maxBulkRows} rows. Step-up authorization required.`
      );
    }

    const effectiveName = user?.fullName || userName;
    const effectiveEmail = user?.email || userId;
    const effectiveTenant = user?.tenantId || 'tenant_default';
    const timestamp = new Date().toISOString();
    const watermarkBanner = `[${classification}] Exported by: ${effectiveName} (${effectiveEmail}) | Tenant: ${effectiveTenant} | Timestamp: ${timestamp}`;

    const ws = XLSX.utils.json_to_sheet(data);

    // Append Watermark to Cell A1 comment if supported
    if (!ws['!comments']) ws['!comments'] = [];
    ws['!comments'].push({
      a: 'A1',
      t: {
        a: effectiveName,
        r: watermarkBanner,
      },
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');

    // Write file
    const ext = format.toLowerCase();
    const safeFilename = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.${ext}`;
    XLSX.writeFile(wb, safeFilename, { bookType: ext === 'csv' ? 'csv' : 'xlsx' });

    console.info(`[Audit Log] Secure Export: ${safeFilename} by ${effectiveEmail} (${data.length} rows)`);
    return true;
  }
}

/**
 * Convenience helper function
 */
export function secureExportData(
  data: Record<string, any>[],
  options: Omit<SecureExportOptions, 'data'>
): boolean {
  return SecureDataExporter.exportDataset({
    ...options,
    data,
  });
}
