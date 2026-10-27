import { useSyncExternalStore } from 'react';
import { useMe } from './useIdentity';

// UI-only view preference ("one plant" vs "all my plants"). Assigned plants themselves always come from the server (/me).
// Super Admin defaults to All Plants scope automatically until a specific plant is explicitly selected.
let allPlantsOverride: boolean | null = null;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setAllPlantsScope(value: boolean) {
  if (allPlantsOverride === value) return;
  allPlantsOverride = value;
  listeners.forEach((l) => l());
}

export interface PlantScope {
  isAll: boolean;
  /** Plant ids every data query must filter by (`plant_id IN plantIds`). */
  plantIds: string[];
  activePlantId: string | null;
}

export function usePlantScope(): PlantScope {
  const { data: me } = useMe();
  const override = useSyncExternalStore(subscribe, () => allPlantsOverride);
  const assigned = me?.plants.map((p) => p.id) ?? [];
  const isSuperAdmin = me?.roleCode === 'SUPER_ADMIN';
  const effectiveAll = override !== null ? override : isSuperAdmin;
  const isAll = effectiveAll && (isSuperAdmin || assigned.length > 1);
  return {
    isAll,
    plantIds: isAll ? assigned : me?.activePlantId ? [me.activePlantId] : [],
    activePlantId: me?.activePlantId ?? null,
  };
}
