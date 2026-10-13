import { createResourceRouter } from '../../core/crud.js';
import { z } from 'zod';

const BomItemSchema = z.object({
  id: z.string().uuid(),
  engineeringId: z.string().uuid(),
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  quantity: z.number().default(1),
  status: z.string().default('ACTIVE'),
  version: z.number().int().min(1).default(1),
});

const CreateBomItemSchema = BomItemSchema.omit({ id: true, version: true }).strict();
const UpdateBomItemSchema = CreateBomItemSchema.partial().extend({
  version: z.number().int().min(1),
}).strict();

export function createBomItemRouter() {
  return createResourceRouter({
    subject: 'Engineering',
    table: 'engineering_bom_item',
    columns: ['id', 'engineering_id', 'tenant_id', 'plant_id', 'code', 'name', 'quantity', 'status', 'version', 'created_at', 'updated_at'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name'],
    createSchema: CreateBomItemSchema,
    updateSchema: UpdateBomItemSchema,
  });
}
