import { createHash } from 'node:crypto';

export interface CacheDriver {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds: number) => Promise<void>;
  del: (key: string) => Promise<void>;
}

// In-memory driver with LRU expiration for Node.js and worker isolate memory
class MemoryDriver implements CacheDriver {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.store.size > 5000) {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (v.expiresAt <= now) this.store.delete(k);
      }
      if (this.store.size > 4000) {
        this.store.clear();
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const memoryCache = new MemoryDriver();
const inFlightRequests = new Map<string, Promise<any>>();

export interface CacheKeyParams {
  tenantId: string;
  plantId?: string | null;
  permHash?: string;
  resource: string;
  params?: Record<string, unknown> | null;
}

export function buildCacheKey(p: CacheKeyParams): string {
  const paramsStr = p.params ? JSON.stringify(p.params) : '';
  const hash = createHash('sha256')
    .update(`${p.permHash || 'public'}:${paramsStr}`)
    .digest('hex')
    .slice(0, 16);
  return `v1:${p.tenantId}:${p.plantId || 'all'}:${p.resource}:${hash}`;
}

export async function getOrLoad<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  driver: CacheDriver = memoryCache,
): Promise<{ data: T; cached: boolean }> {
  // 1. Check existing cached item
  try {
    const raw = await driver.get(key);
    if (raw) {
      return { data: JSON.parse(raw) as T, cached: true };
    }
  } catch {
    // Fail open: continue to loader
  }

  // 2. Single-flight deduplication: collapse parallel requests for same key into 1 loader execution
  let inFlight = inFlightRequests.get(key);
  if (inFlight) {
    const data = await inFlight;
    return { data, cached: true };
  }

  const promise = (async () => {
    const result = await loader();
    try {
      await driver.set(key, JSON.stringify(result), ttlSeconds);
    } catch {
      // Fail open
    }
    return result;
  })();

  inFlightRequests.set(key, promise);
  try {
    const data = await promise;
    return { data, cached: false };
  } finally {
    inFlightRequests.delete(key);
  }
}

export async function invalidateCacheKey(key: string, driver: CacheDriver = memoryCache): Promise<void> {
  try {
    await driver.del(key);
  } catch {
    // Fail open
  }
}
