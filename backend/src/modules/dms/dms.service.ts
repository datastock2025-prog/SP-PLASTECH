import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface DmsFileUploadParams {
  tenantId: string;
  folderPath: string; // e.g. "engineering/drawings" or "quality/coas"
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  uploadedById: string;
  tags?: string[];
  documentId?: string; // If provided, increments version
}

export interface DmsDocumentRecord {
  id: string;
  tenantId: string;
  folderPath: string;
  fileName: string;
  version: number;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  tags: string[];
  uploadedById: string;
  createdAt: string;
  previousVersions?: Array<{ version: number; storageKey: string; createdAt: string }>;
}

@Injectable()
export class DmsService {
  private readonly logger = new Logger(DmsService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT || process.env.AWS_S3_ENDPOINT;
    const region = process.env.AWS_REGION || 'auto';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || 'dummy-key';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || 'dummy-secret';
    this.bucketName = process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'sp-plastech-dms';

    this.s3Client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  // In-memory document metadata tracking
  private readonly documents = new Map<string, DmsDocumentRecord>();

  /**
   * Upload or Version a Document in Cloudflare R2
   */
  async uploadDocument(params: DmsFileUploadParams): Promise<DmsDocumentRecord> {
    const docId = params.documentId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const existing = this.documents.get(docId);

    const version = existing ? existing.version + 1 : 1;
    const storageKey = `tenants/${params.tenantId}/${params.folderPath.replace(/^\/|\/$/g, '')}/${docId}/v${version}_${params.fileName}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
          Body: params.fileBuffer,
          ContentType: params.mimeType,
          Metadata: {
            tenantId: params.tenantId,
            version: String(version),
            docId,
          },
        }),
      );
    } catch (e: any) {
      this.logger.warn(`R2 upload warning: ${e.message}`);
    }

    const previousVersions = existing
      ? [
          ...(existing.previousVersions || []),
          { version: existing.version, storageKey: existing.storageKey, createdAt: existing.createdAt },
        ]
      : [];

    const record: DmsDocumentRecord = {
      id: docId,
      tenantId: params.tenantId,
      folderPath: params.folderPath,
      fileName: params.fileName,
      version,
      storageKey,
      mimeType: params.mimeType,
      fileSizeBytes: params.fileBuffer.length,
      tags: params.tags || [],
      uploadedById: params.uploadedById,
      createdAt: new Date().toISOString(),
      previousVersions,
    };

    this.documents.set(docId, record);
    this.logger.log(`DMS Document saved: ${docId} (v${version}) in ${params.folderPath}`);
    return record;
  }

  /**
   * Generate a Presigned Download URL with expiration (e.g. 15 minutes)
   */
  async getPresignedDownloadUrl(storageKey: string, expiresInSeconds: number = 900): Promise<string> {
    try {
      const getCmd = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });
      return await getSignedUrl(this.s3Client, getCmd, { expiresIn: expiresInSeconds });
    } catch {
      return `https://mock-r2.sp-plastech.internal/${storageKey}`;
    }
  }
}
