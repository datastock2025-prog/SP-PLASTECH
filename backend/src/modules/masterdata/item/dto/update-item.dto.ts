import { z } from 'zod';
import { CreateItemDtoSchema } from './create-item.dto';

export const UpdateItemDtoSchema = CreateItemDtoSchema.partial().extend({
  // Mandated by Section 6.3: Optimistic Concurrency Control
  version: z.number({ required_error: 'version is required for optimistic concurrency control' }).int().positive(),
});

export type UpdateItemDto = z.infer<typeof UpdateItemDtoSchema>;
