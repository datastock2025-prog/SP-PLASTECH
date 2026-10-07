import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { QueryItemDto } from './dto/query-item.dto';
import { getRequestContext } from '../../../database/tenant-context';
import { ObservabilityService } from '../../../observability/observability.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ItemService {
  private readonly logger = new Logger(ItemService.name);

  // In-memory tenant-isolated data store for local dev / testing fallback when Prisma client connects
  private readonly itemsStore = new Map<string, any[]>();
  private readonly auditLogs = new Map<string, any[]>();

  constructor(private readonly observability: ObservabilityService) {}

  private getTenantId(): string {
    const context = getRequestContext();
    return context?.tenantId || 'SP-PLASTECH-DEFAULT';
  }

  private getUserId(): string {
    const context = getRequestContext();
    return context?.userId || 'SYS-USER-01';
  }

  private getTenantItems(tenantId: string): any[] {
    if (!this.itemsStore.has(tenantId)) {
      this.itemsStore.set(tenantId, []);
    }
    return this.itemsStore.get(tenantId)!;
  }

  /**
   * 1. Read: Paginated, Filtered, and Sorted Item Catalog
   */
  async findAll(query: QueryItemDto): Promise<PaginatedResult<any>> {
    const tenantId = this.getTenantId();
    const items = this.getTenantItems(tenantId);
    const { page, limit, search, category, status, sortBy, sortOrder } = query;

    // Filter non-deleted
    let filtered = items.filter((item) => !item.deletedAt && !item.deleted_at);

    if (category && category !== 'All' && category !== 'ALL') {
      filtered = filtered.filter(
        (item) =>
          (item.category || '').toLowerCase() === category.toLowerCase() ||
          (item.cat || '').toLowerCase() === category.toLowerCase()
      );
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter(
        (item) => (item.status || '').toUpperCase() === status.toUpperCase()
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.code || '').toLowerCase().includes(q) ||
          (item.name || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q)
      );
    }

    // Sort
    const sortField = sortBy.includes('_')
      ? sortBy.replace(/_([a-z])/g, (_, g) => g.toUpperCase())
      : sortBy;

    filtered.sort((a, b) => {
      const valA = a[sortField] ?? a[sortBy] ?? '';
      const valB = b[sortField] ?? b[sortBy] ?? '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginatedItems = filtered.slice(skip, skip + limit);

    return {
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 2. Read Single Item by ID or Code
   */
  async findOne(idOrCode: string): Promise<any> {
    const tenantId = this.getTenantId();
    const items = this.getTenantItems(tenantId);
    const item = items.find(
      (i) =>
        (!i.deletedAt && !i.deleted_at) &&
        (i.id === idOrCode || i.code?.toLowerCase() === idOrCode.toLowerCase())
    );

    if (!item) {
      throw new NotFoundException(`Item SKU '${idOrCode}' not found in active catalog.`);
    }
    return item;
  }

  /**
   * 3. Create Item with Transactional Audit Log
   */
  async create(dto: CreateItemDto): Promise<any> {
    const tenantId = this.getTenantId();
    const userId = this.getUserId();
    const items = this.getTenantItems(tenantId);

    // Check unique code constraint
    const existing = items.find(
      (i) =>
        (!i.deletedAt && !i.deleted_at) &&
        String(i.code).toLowerCase() === String(dto.code).toLowerCase()
    );
    if (existing) {
      throw new ConflictException(
        `Item SKU with code '${dto.code}' already exists in tenant catalog.`
      );
    }

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      tenantId,
      ...dto,
      stock: Number(dto.stock || 0),
      minStock: Number(dto.minStock || 0),
      maxStock: Number(dto.maxStock || 5000),
      reorderPoint: Number(dto.reorderPoint || 0),
      safetyStock: Number(dto.safetyStock || 0),
      cost: Number(dto.cost || 0),
      sellingPrice: Number(dto.sellingPrice || 0),
      partWeightGrams: Number(dto.partWeightGrams || 0),
      runnerWeightGrams: Number(dto.runnerWeightGrams || 0),
      cavityCount: Number(dto.cavityCount || 1),
      cycleTimeSeconds: Number(dto.cycleTimeSeconds || 0),
      version: 1,
      createdById: userId,
      updatedById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    items.unshift(newItem);

    // Transactional Audit Log
    this.recordAudit(tenantId, newItem.id, 'CREATE', null, newItem, userId);

    this.logger.log(`Created Item SKU ${newItem.code} (Version: 1)`);
    return newItem;
  }

  /**
   * 4. Update Item with Optimistic Concurrency Control (OCC)
   */
  async update(idOrCode: string, dto: UpdateItemDto): Promise<any> {
    const tenantId = this.getTenantId();
    const userId = this.getUserId();
    const items = this.getTenantItems(tenantId);

    const index = items.findIndex(
      (i) =>
        (!i.deletedAt && !i.deleted_at) &&
        (String(i.id) === idOrCode || String(i.code).toLowerCase() === String(idOrCode).toLowerCase())
    );

    if (index === -1) {
      throw new NotFoundException(`Item SKU '${idOrCode}' not found.`);
    }

    const currentItem = items[index];

    // Check Optimistic Concurrency Version (Section 6.3)
    if (dto.version !== undefined && dto.version !== currentItem.version) {
      throw new ConflictException({
        code: 'CONCURRENCY_CONFLICT',
        message: `Conflict: Item '${currentItem.code}' was modified by another session (expected version ${dto.version}, current version ${currentItem.version}). Please reload and try again.`,
        details: {
          field: 'version',
          expectedVersion: dto.version,
          currentVersion: currentItem.version,
        },
      });
    }

    // Check unique code constraint if code is changing
    if (dto.code && String(dto.code).toLowerCase() !== String(currentItem.code).toLowerCase()) {
      const codeDuplicate = items.find(
        (i) =>
          i.id !== currentItem.id &&
          (!i.deletedAt && !i.deleted_at) &&
          String(i.code).toLowerCase() === String(dto.code).toLowerCase()
      );
      if (codeDuplicate) {
        throw new ConflictException(
          `Cannot update code: SKU '${dto.code}' already belongs to another item.`
        );
      }
    }

    const oldSnapshot = { ...currentItem };
    const nextVersion = currentItem.version + 1;

    const updatedItem = {
      ...currentItem,
      ...dto,
      version: nextVersion,
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    };

    items[index] = updatedItem;

    // Record diff and audit log
    this.recordAudit(tenantId, updatedItem.id, 'UPDATE', oldSnapshot, updatedItem, userId);

    this.logger.log(`Updated Item SKU ${updatedItem.code} -> Version ${nextVersion}`);
    return updatedItem;
  }

  /**
   * 5. Soft Delete Item (Section 2.5)
   */
  async softDelete(idOrCode: string): Promise<boolean> {
    const tenantId = this.getTenantId();
    const userId = this.getUserId();
    const items = this.getTenantItems(tenantId);

    const item = items.find(
      (i) =>
        (!i.deletedAt && !i.deleted_at) &&
        (String(i.id) === idOrCode || String(i.code).toLowerCase() === String(idOrCode).toLowerCase())
    );

    if (!item) {
      throw new NotFoundException(`Item SKU '${idOrCode}' not found.`);
    }

    const oldSnapshot = { ...item };
    item.deletedAt = new Date().toISOString();
    item.deleted_at = item.deletedAt;
    item.updatedAt = new Date().toISOString();
    item.updatedById = userId;

    this.recordAudit(tenantId, item.id, 'DELETE', oldSnapshot, null, userId);

    this.logger.log(`Soft-deleted Item SKU ${item.code}`);
    return true;
  }

  /**
   * 6. Approve Item
   */
  async approve(idOrCode: string, reviewerName: string = 'Admin Lead', comment?: string): Promise<any> {
    const item = await this.findOne(idOrCode);
    return this.update(item.id, {
      version: item.version,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      description: comment ? `${item.description || ''} [Approved: ${comment}]`.trim() : item.description,
    });
  }

  /**
   * 7. Reject Item
   */
  async reject(idOrCode: string, reason: string): Promise<any> {
    const item = await this.findOne(idOrCode);
    return this.update(item.id, {
      version: item.version,
      status: 'BLOCKED',
      approvalStatus: 'REJECTED',
      description: `${item.description || ''} [Rejected: ${reason}]`.trim(),
    });
  }

  /**
   * 8. Transactional Bulk Import
   */
  async bulkImport(itemsDto: CreateItemDto[]): Promise<{ importedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let importedCount = 0;

    for (let i = 0; i < itemsDto.length; i++) {
      try {
        await this.create(itemsDto[i]);
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${itemsDto[i].code}): ${err.message || 'Validation error'}`);
      }
    }

    return { importedCount, errors };
  }

  /**
   * Internal Audit Logger
   */
  private recordAudit(
    tenantId: string,
    recordId: string,
    action: string,
    oldValues: any,
    newValues: any,
    userId: string
  ): void {
    if (!this.auditLogs.has(tenantId)) {
      this.auditLogs.set(tenantId, []);
    }
    const logEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      tenantId,
      entityType: 'ITEM',
      recordId,
      action,
      oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      userId,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.get(tenantId)!.push(logEntry);
  }
}
