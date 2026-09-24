import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ObservabilityLogger } from '../observability/logger.service';
import { MetricsService } from '../observability/metrics.service';
import { TracingService } from '../observability/tracing.service';

export interface BaseEntity {
  id: string;
  tenant_id: string;
  version: string;
  created_by_id: string;
  updated_by_id?: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class BaseRepository<T extends BaseEntity = any> {
  constructor(
    protected readonly db: DatabaseService,
    protected readonly tableName: string,
    protected readonly logger: ObservabilityLogger,
    protected readonly metrics: MetricsService,
    protected readonly tracing: TracingService
  ) {}

  public async findById(id: string, tenantId: string = 'TENANT-ALPHA-IND'): Promise<T | null> {
    return this.tracing.traceOperation(
      `${this.tableName}.findById`,
      async () => {
        const startTime = Date.now();
        const res = await this.db.query(
          `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [id, tenantId]
        );
        const durationSec = (Date.now() - startTime) / 1000;
        this.metrics.observeDbQueryDuration('findById', this.tableName, durationSec);
        return (res.rows[0] as T) || null;
      },
      { entityId: id, tenantId }
    );
  }

  public async findAll(
    tenantId: string = 'TENANT-ALPHA-IND',
    filters: Record<string, any> = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: T[]; total: number }> {
    return this.tracing.traceOperation(
      `${this.tableName}.findAll`,
      async () => {
        const startTime = Date.now();
        const page = pagination.page || 1;
        const limit = pagination.limit || 50;
        const offset = (page - 1) * limit;

        const res = await this.db.query(
          `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
          [tenantId, limit, offset]
        );

        const countRes = await this.db.query(
          `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = $1 AND deleted_at IS NULL`,
          [tenantId]
        );

        const durationSec = (Date.now() - startTime) / 1000;
        this.metrics.observeDbQueryDuration('findAll', this.tableName, durationSec);
        this.metrics.incrementBusinessEvent('entity_read', this.tableName);

        return {
          data: res.rows as T[],
          total: parseInt(countRes.rows[0]?.count || '0', 10),
        };
      },
      { tenantId }
    );
  }

  public incrementVersion(version: string = 'v1.0'): string {
    const match = (version || 'v1.0').match(/v(\d+)\.(\d+)/);
    if (!match) return 'v1.1';
    return `v${match[1]}.${parseInt(match[2], 10) + 1}`;
  }
}
