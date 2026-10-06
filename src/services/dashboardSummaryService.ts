/**
 * @deprecated dashboardSummaryService is deprecated and removed.
 * Single Source of Truth (SSOT) is managed strictly via TanStack React Query v5
 * (e.g., useItems, useItemCount from src/hooks/useMasterData.ts).
 */
export const dashboardSummaryService = {
  invalidateCache(): void {
    // No-op: Cache invalidation is handled by TanStack QueryClient invalidateQueries
  },
};


