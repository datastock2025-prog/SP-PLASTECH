import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Header,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto, CreateItemDtoSchema } from './dto/create-item.dto';
import { UpdateItemDto, UpdateItemDtoSchema } from './dto/update-item.dto';
import { QueryItemDto, QueryItemDtoSchema } from './dto/query-item.dto';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  /**
   * GET /api/v1/items
   * Paginated, filtered, sorted item master list
   */
  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  async findAll(@Query() queryParams: Record<string, any>) {
    const parseResult = QueryItemDtoSchema.safeParse(queryParams);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: parseResult.error.format(),
      });
    }

    const result = await this.itemService.findAll(parseResult.data);
    return {
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * GET /api/v1/items/:id
   * Get single item by ID or SKU Code
   */
  @Get(':id')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  async findOne(@Param('id') id: string) {
    const item = await this.itemService.findOne(id);
    return { data: item };
  }

  /**
   * POST /api/v1/items
   * Create new Item Master SKU
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    const parseResult = CreateItemDtoSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed for new SKU',
        details: parseResult.error.format(),
      });
    }

    const created = await this.itemService.create(parseResult.data);
    return { data: created };
  }

  /**
   * PUT /api/v1/items/:id
   * Full replacement update with Optimistic Concurrency Control
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const parseResult = UpdateItemDtoSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed for SKU update',
        details: parseResult.error.format(),
      });
    }

    const updated = await this.itemService.update(id, parseResult.data);
    return { data: updated };
  }

  /**
   * PATCH /api/v1/items/:id
   * Partial update with Optimistic Concurrency Control
   */
  @Patch(':id')
  async patch(@Param('id') id: string, @Body() body: any) {
    const parseResult = UpdateItemDtoSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed for SKU patch',
        details: parseResult.error.format(),
      });
    }

    const updated = await this.itemService.update(id, parseResult.data);
    return { data: updated };
  }

  /**
   * DELETE /api/v1/items/:id
   * Soft delete item (204 No Content)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.itemService.softDelete(id);
  }

  /**
   * POST /api/v1/items/:id/approve
   * Approve SKU and release to production catalog
   */
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body('comment') comment?: string) {
    const item = await this.itemService.approve(id, 'Admin Lead', comment);
    return { data: item };
  }

  /**
   * POST /api/v1/items/:id/reject
   * Reject SKU approval request
   */
  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body('reason') reason: string = 'Rejected in QA review') {
    const item = await this.itemService.reject(id, reason);
    return { data: item };
  }

  /**
   * POST /api/v1/items/bulk-import
   * Batch transactional import of items
   */
  @Post('bulk-import')
  async bulkImport(@Body('items') items: any[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items array must not be empty');
    }

    const validatedItems: CreateItemDto[] = [];
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const parseResult = CreateItemDtoSchema.safeParse(items[i]);
      if (parseResult.success) {
        validatedItems.push(parseResult.data);
      } else {
        errors.push(`Row ${i + 1}: ${JSON.stringify(parseResult.error.flatten().fieldErrors)}`);
      }
    }

    const result = await this.itemService.bulkImport(validatedItems);
    return {
      data: {
        importedCount: result.importedCount,
        errors: [...errors, ...result.errors],
      },
    };
  }
}
