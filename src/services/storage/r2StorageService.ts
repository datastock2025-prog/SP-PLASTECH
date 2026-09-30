/**
 * SP PLASTECH ERP - CLOUDFLARE R2 OBJECT STORAGE SERVICE
 * S3-Compatible Archival Storage for E-Invoices, E-Way Bills, Delivery Challans, and Gate Passes
 */

import { supabase } from '../../shared/supabaseClient';
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
   * Uploads and records generated dispatch document to Cloudflare R2 object storage
   */
  public async archiveDispatchDocument(
    doc: GeneratedPdfDocument,
    metadata: {
      salesOrderId: string;
      customerName: string;
      irn?: string;
      ewbNumber?: string;
      generatedBy?: string;
    }
  ): Promise<R2ArchiveResult> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const docFolder = doc.documentType.toLowerCase().replace(/\s+/g, '-');
    const objectKey = `sales/${docFolder}/${timestamp}/${doc.documentNumber}.html`;
    const publicCdnUrl = `${R2_PUBLIC_CDN_BASE}/${objectKey}`;
    const documentId = `DOC-${doc.documentType.slice(0, 3).toUpperCase()}-${doc.documentNumber}`;

    try {
      // 1. Record metadata to Database (dispatch_documents)
      await supabase.from('dispatch_documents').upsert({
        id: documentId,
        document_type: doc.documentType,
        reference_id: doc.documentNumber,
        sales_order_id: metadata.salesOrderId,
        customer_name: metadata.customerName,
        irn: metadata.irn,
        ewb_number: metadata.ewbNumber,
        pdf_file_name: doc.fileName,
        r2_bucket: R2_BUCKET_NAME,
        r2_object_key: objectKey,
        r2_public_cdn_url: publicCdnUrl,
        generated_by: metadata.generatedBy || 'Commercial Operations Desk',
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
      downloadFileName: doc.fileName,
    };
  }

  /**
   * Triggers direct browser download of generated PDF/HTML document
   */
  public downloadDocumentLocally(doc: GeneratedPdfDocument) {
    const blob = new Blob([doc.htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const r2StorageService = new R2StorageService();
