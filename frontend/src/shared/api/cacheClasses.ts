export type CacheClass = 'reference' | 'list' | 'detail' | 'dashboard' | 'immutable';

export interface CacheClassConfig {
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
  cacheControl: string;
}

export const CACHE_CLASSES: Record<CacheClass, CacheClassConfig> = {
  // Roles, plants, permission catalogue, units, categories, numbering config
  reference: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    cacheControl: 'private, no-cache, must-revalidate',
  },
  // Active entity lists: items, suppliers, customers, work orders
  list: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    cacheControl: 'private, no-cache, must-revalidate',
  },
  // Edit forms and record detail: always revalidate against authoritative DB state
  detail: {
    staleTime: 0, // Always revalidate
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    cacheControl: 'no-store, no-cache, must-revalidate',
  },
  // Dashboard summaries and telemetry
  dashboard: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    cacheControl: 'private, max-age=30',
  },
  // Released BOM revisions, finalized MRP runs, closed-period reports
  immutable: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    cacheControl: 'public, max-age=86400, immutable',
  },
};

export function getCacheOptions(cacheClass: CacheClass = 'list') {
  const config = CACHE_CLASSES[cacheClass] || CACHE_CLASSES.list;
  return {
    staleTime: config.staleTime,
    gcTime: config.gcTime,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
  };
}
