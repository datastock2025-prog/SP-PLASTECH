/**
 * Private document storage behind one interface. Local disk today; an S3/R2 adapter can be
 * dropped in later (DOCUMENT_STORAGE_PROVIDER) without touching the worker or routes.
 * Node-only: imported dynamically so Worker-runtime route bundles never load node:fs.
 */
import { createHash } from 'node:crypto';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';

export interface StoredFile {
  provider: string;
  key: string;
  sizeBytes: number;
  checksumSha256: string;
}

export interface DocumentStorage {
  readonly provider: string;
  save(key: string, data: Buffer): Promise<StoredFile>;
  saveFile(key: string, data: Buffer, meta?: { mimeType?: string; fileName?: string }): Promise<StoredFile>;
  read(key: string): Promise<Buffer>;
  getFile(key: string): Promise<Buffer>;
  stream(key: string): NodeJS.ReadableStream;
  remove(key: string): Promise<void>;
}

const KEY_RE = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,250}$/;

class LocalDocumentStorage implements DocumentStorage {
  readonly provider = 'local';
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    if (!KEY_RE.test(key) || key.includes('..')) throw new Error('Invalid storage key');
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error('Invalid storage key');
    return full;
  }

  async save(key: string, data: Buffer): Promise<StoredFile> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return {
      provider: this.provider,
      key,
      sizeBytes: data.length,
      checksumSha256: createHash('sha256').update(data).digest('hex'),
    };
  }

  async saveFile(key: string, data: Buffer, _meta?: { mimeType?: string; fileName?: string }): Promise<StoredFile> {
    return this.save(key, data);
  }

  read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  getFile(key: string): Promise<Buffer> {
    return this.read(key);
  }

  stream(key: string): NodeJS.ReadableStream {
    return createReadStream(this.resolve(key));
  }

  async remove(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }
}

let instance: DocumentStorage | null = null;

export function getDocumentStorage(): DocumentStorage {
  if (instance) return instance;
  const provider = process.env.DOCUMENT_STORAGE_PROVIDER || 'local';
  if (provider !== 'local') {
    // shortcut: only local is implemented; add S3/R2 adapter here when moving to cloud.
    throw new Error(`Document storage provider '${provider}' is not configured`);
  }
  instance = new LocalDocumentStorage(
    process.env.DOCUMENT_STORAGE_DIR || path.resolve(process.cwd(), 'storage', 'documents'),
  );
  return instance;
}

