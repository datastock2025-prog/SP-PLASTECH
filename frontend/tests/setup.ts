// Global Vitest Environment Setup
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  } as any;
}

if (typeof globalThis.sessionStorage === 'undefined') {
  const sessionStore = new Map<string, string>();
  globalThis.sessionStorage = {
    getItem: (k: string) => sessionStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      sessionStore.set(k, String(v));
    },
    removeItem: (k: string) => {
      sessionStore.delete(k);
    },
    clear: () => {
      sessionStore.clear();
    },
    key: (i: number) => Array.from(sessionStore.keys())[i] ?? null,
    get length() {
      return sessionStore.size;
    },
  } as any;
}
