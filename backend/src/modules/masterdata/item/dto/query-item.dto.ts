import { z } from 'zod';

export const ALLOWED_SORT_COLUMNS = [
  'code',
  'name',
  'category',
  'stock',
  'cost',
  'sellingPrice',
  'selling_price',
  'status',
  'approvalStatus',
  'approval_status',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
] as const;

export const QueryItemDtoSchema = z.object({
  page: z.preprocess((val) => Math.max(1, Number(val) || 1), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => Math.min(100, Math.max(1, Number(val) || 20)), z.number().int().positive().default(20)),
  search: z.string().trim().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(ALLOWED_SORT_COLUMNS).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryItemDto = z.infer<typeof QueryItemDtoSchema>;
