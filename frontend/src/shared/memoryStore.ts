/**
 * In-Memory Ephemeral Storage
 * Enforces Zero-ClientStorage Enterprise Architecture Rule #3.
 * Provides transient in-memory storage for legacy sync services without touching client storage (local or session web storage).
 */
class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const memoryStorage = new MemoryStorage();
