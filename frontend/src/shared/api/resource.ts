import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { http, one, page, type RequestOptions } from './http';

export interface ResourceSchemas<TRow, TCreate, TUpdate, TQuery = any> {
  row: z.ZodType<TRow>;
  create?: z.ZodType<TCreate>;
  update?: z.ZodType<TUpdate>;
  query?: z.ZodType<TQuery>;
}

export interface ResourceApi<TRow, TCreate, TUpdate, TQuery = any> {
  basePath: string;
  list: (params?: TQuery) => Promise<{ data: TRow[]; meta: { page: number; limit: number; total: number; totalPages: number } }>;
  get: (id: string) => Promise<TRow>;
  create: (data: TCreate) => Promise<TRow>;
  update: (id: string, data: TUpdate) => Promise<TRow>;
  delete: (id: string) => Promise<void>;
  history: (id: string) => Promise<any[]>;
}

export function createResourceApi<TRow, TCreate = any, TUpdate = any, TQuery = any>(
  basePath: string,
  schemas: ResourceSchemas<TRow, TCreate, TUpdate, TQuery>
): ResourceApi<TRow, TCreate, TUpdate, TQuery> {
  return {
    basePath,
    list: async (params?: TQuery) => {
      const res = await http.get(basePath, { params: params as any });
      return page(schemas.row, res);
    },
    get: async (id: string) => {
      const res = await http.get(`${basePath}/${id}`);
      return one(schemas.row, res);
    },
    create: async (data: TCreate) => {
      const res = await http.post(basePath, data);
      return one(schemas.row, res);
    },
    update: async (id: string, data: TUpdate) => {
      const res = await http.patch(`${basePath}/${id}`, data);
      return one(schemas.row, res);
    },
    delete: async (id: string) => {
      await http.delete(`${basePath}/${id}`);
    },
    history: async (id: string) => {
      const res = await http.get(`${basePath}/${id}/history`);
      return res?.data ?? [];
    },
  };
}

export function createResourceHooks<TRow, TCreate = any, TUpdate = any, TQuery = any>(
  resourceKey: string,
  api: ResourceApi<TRow, TCreate, TUpdate, TQuery>
) {
  const keys = {
    all: [resourceKey] as const,
    lists: () => [resourceKey, 'list'] as const,
    list: (params?: TQuery) => [resourceKey, 'list', params ?? {}] as const,
    details: () => [resourceKey, 'detail'] as const,
    detail: (id: string) => [resourceKey, 'detail', id] as const,
    history: (id: string) => [resourceKey, 'history', id] as const,
  };

  function useList(params?: TQuery, options?: Partial<UseQueryOptions<{ data: TRow[]; meta: any }>>) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: () => api.list(params),
      staleTime: 30_000,
      ...options,
    });
  }

  function useDetail(id: string | null | undefined, options?: Partial<UseQueryOptions<TRow>>) {
    return useQuery({
      queryKey: keys.detail(id || ''),
      queryFn: () => api.get(id!),
      enabled: !!id,
      staleTime: 30_000,
      ...options,
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: TCreate) => api.create(payload),
      onSuccess: (created: any) => {
        if (created?.id) {
          qc.setQueryData(keys.detail(created.id), created);
        }
        qc.invalidateQueries({ queryKey: keys.lists() });
      },
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdate }) => api.update(id, data),
      onSuccess: (updated: any, vars) => {
        if (vars?.id) {
          qc.setQueryData(keys.detail(vars.id), updated);
        }
        qc.invalidateQueries({ queryKey: keys.lists() });
      },
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.delete(id),
      onSuccess: (_res, id) => {
        qc.removeQueries({ queryKey: keys.detail(id) });
        qc.invalidateQueries({ queryKey: keys.lists() });
      },
    });
  }

  function useHistory(id: string | null | undefined) {
    return useQuery({
      queryKey: keys.history(id || ''),
      queryFn: () => api.history(id!),
      enabled: !!id,
      staleTime: 60_000,
    });
  }

  return {
    keys,
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
    useHistory,
  };
}
