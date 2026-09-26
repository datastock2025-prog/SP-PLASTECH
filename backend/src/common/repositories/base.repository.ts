import { Injectable } from '@nestjs/common';
import { ObservabilityService, SpanContext } from '../../observability/observability.service';
import { getRequestContext } from '../../database/tenant-context';

export interface FindManyOptions {
  skip?: number;
  take?: number;
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

@Injectable()
export abstract class BaseRepository<TModel, TCreateInput, TUpdateInput> {
  constructor(
    protected readonly modelDelegate: any,
    protected readonly modelName: string,
    protected readonly observability: ObservabilityService
  ) {}

  protected getTenantId(): string {
    const context = getRequestContext();
    return context?.tenantId || 'SP-PLASTECH-DEFAULT';
  }

  public async findById(id: string): Promise<TModel | null> {
    const span: SpanContext = this.observability.startSpan(`${this.modelName}.findById`);
    try {
      const result = await this.modelDelegate.findFirst({
        where: { id, tenantId: this.getTenantId() },
      });
      this.observability.endSpan(span, true);
      return result;
    } catch (err) {
      this.observability.endSpan(span, false, err as Error);
      throw err;
    }
  }

  public async findMany(options: FindManyOptions = {}): Promise<{ items: TModel[]; total: number }> {
    const span: SpanContext = this.observability.startSpan(`${this.modelName}.findMany`);
    try {
      const tenantWhere = {
        ...options.where,
        tenantId: this.getTenantId(),
      };

      const [items, total] = await Promise.all([
        this.modelDelegate.findMany({
          where: tenantWhere,
          skip: options.skip,
          take: options.take,
          orderBy: options.orderBy,
        }),
        this.modelDelegate.count({ where: tenantWhere }),
      ]);

      this.observability.endSpan(span, true);
      return { items, total };
    } catch (err) {
      this.observability.endSpan(span, false, err as Error);
      throw err;
    }
  }

  public async create(data: TCreateInput): Promise<TModel> {
    const span: SpanContext = this.observability.startSpan(`${this.modelName}.create`);
    try {
      const payloadWithTenant = {
        ...data,
        tenantId: this.getTenantId(),
      };
      const result = await this.modelDelegate.create({ data: payloadWithTenant });
      this.observability.endSpan(span, true);
      return result;
    } catch (err) {
      this.observability.endSpan(span, false, err as Error);
      throw err;
    }
  }

  public async update(id: string, data: TUpdateInput): Promise<TModel> {
    const span: SpanContext = this.observability.startSpan(`${this.modelName}.update`);
    try {
      const result = await this.modelDelegate.update({
        where: { id },
        data: {
          ...data,
          version: { increment: 1 },
        },
      });
      this.observability.endSpan(span, true);
      return result;
    } catch (err) {
      this.observability.endSpan(span, false, err as Error);
      throw err;
    }
  }

  public async delete(id: string): Promise<TModel> {
    const span: SpanContext = this.observability.startSpan(`${this.modelName}.delete`);
    try {
      const result = await this.modelDelegate.delete({
        where: { id },
      });
      this.observability.endSpan(span, true);
      return result;
    } catch (err) {
      this.observability.endSpan(span, false, err as Error);
      throw err;
    }
  }
}
