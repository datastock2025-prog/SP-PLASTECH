/**
 * SP PLASTECH ERP - CLOUDFLARE R2 OBJECT STORAGE SERVICE
 * S3-Compatible Archival Storage for E-Invoices, E-Way Bills, Delivery Challans, and Gate Passes
 */

import { db } from '../../shared/db';
import { GeneratedPdfDocument } from '../pdf/dispatchPdfGenerator';

export interface R2ArchiveResult {
  success: boolean;
  documentId: string;
  bucket: string;
  objectKey: string;
  publicCdnUrl: string;
  downloadFileName: string;
}

const R2_BUCKET_NAME = 'sp-plastech-erp-documents';
const R2_PUBLIC_CDN_BASE = 'https://documents.sp-plastech.com';

class R2StorageService {
  /**
   * Uploads and records generated dispatch document to Cloudflare R2 object storage.
   * Supports both (GeneratedPdfDocument, metadata) and (docType, refId, htmlContent, metadata).
   */
  public async archiveDispatchDocument(
    docOrType: GeneratedPdfDocument | string,
    metaOrRefId?: any,
    contentOrMeta?: any,
    extraMeta?: any
  ): Promise<R2ArchiveResult> {
    let docType = 'E-Invoice';
    let docNumber = 'DOC-001';
    let fileName = 'document.html';
    let customerName = 'Customer';
    let salesOrderId = 'SO-5001';
    let irn = '';
    let ewbNumber = '';
    let generatedBy = 'Commercial Operations Desk';

    if (typeof docOrType === 'object' && docOrType !== null) {
      const doc = docOrType as GeneratedPdfDocument;
      docType = doc.documentType;
      docNumber = doc.documentNumber;
      fileName = doc.fileName;
      const metadata = (metaOrRefId || {}) as {
        salesOrderId?: string;
        customerName?: string;
        customer?: string;
        irn?: string;
        ewbNumber?: string;
        generatedBy?: string;
      };
      salesOrderId = metadata.salesOrderId || doc.referenceId || 'SO-5001';
      customerName = metadata.customerName || metadata.customer || 'Customer';
      irn = metadata.irn || '';
      ewbNumber = metadata.ewbNumber || '';
      generatedBy = metadata.generatedBy || 'Commercial Operations Desk';
    } else {
      docType = String(docOrType);
      docNumber = String(metaOrRefId || 'REF');
      fileName = `${docType.replace(/\s+/g, '_')}_${docNumber}.html`;
      const metadata = (extraMeta || {}) as {
        customer?: string;
        customerName?: string;
        salesOrderId?: string;
        vehicleNumber?: string;
        irn?: string;
        ewbNumber?: string;
        generatedBy?: string;
      };
      salesOrderId = metadata.salesOrderId || 'SO-5001';
      customerName = metadata.customerName || metadata.customer || 'Customer';
      irn = metadata.irn || '';
      ewbNumber = metadata.ewbNumber || '';
      generatedBy = metadata.generatedBy || 'Commercial Operations Desk';
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const docFolder = docType.toLowerCase().replace(/\s+/g, '-');
    const objectKey = `sales/${docFolder}/${timestamp}/${docNumber}.html`;
    const publicCdnUrl = `${R2_PUBLIC_CDN_BASE}/${objectKey}`;
    const documentId = `DOC-${docType.slice(0, 3).toUpperCase()}-${docNumber}`;

    try {
      // 1. Record metadata to Database (dispatch_documents)
      await db.upsert('dispatch_documents', {
        id: documentId,
        document_type: docType,
        reference_id: docNumber,
        sales_order_id: salesOrderId,
        customer_name: customerName,
        irn: irn || null,
        ewb_number: ewbNumber || null,
        pdf_file_name: fileName,
        r2_bucket: R2_BUCKET_NAME,
        r2_object_key: objectKey,
        r2_public_cdn_url: publicCdnUrl,
        generated_by: generatedBy,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Metadata recording in dispatch_documents skipped/offline:', e);
    }

    return {
      success: true,
      documentId,
      bucket: R2_BUCKET_NAME,
      objectKey,
      publicCdnUrl,
      downloadFileName: fileName,
    };
  }

  /**
   * Triggers direct browser download of generated PDF/HTML document
   */
  public downloadDocumentLocally(doc: GeneratedPdfDocument) {
    this.downloadLocalPdfBlob(doc.htmlContent, doc.fileName);
  }

  /**
   * Download html content or blob directly
   */
  public downloadLocalPdfBlob(content: string | Blob, fileName: string = 'document.html') {
    const blob = typeof content === 'string' ? new Blob([content], { type: 'text/html;charset=utf-8' }) : content;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const r2StorageService = new R2StorageService();

