import { useSyncExternalStore } from 'react';
import { useMe } from './useIdentity';

// UI-only view preference ("one plant" vs "all my plants"). Assigned plants themselves always come from the server (/me).
let allPlants = false;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setAllPlantsScope(value: boolean) {
  if (allPlants === value) return;
  allPlants = value;
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
  const all = useSyncExternalStore(subscribe, () => allPlants);
  const assigned = me?.plants.map((p) => p.id) ?? [];
  const isAll = all && assigned.length > 1;
  return {
    isAll,
    plantIds: isAll ? assigned : me?.activePlantId ? [me.activePlantId] : [],
    activePlantId: me?.activePlantId ?? null,
  };
}
