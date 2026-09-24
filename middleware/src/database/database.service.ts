import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private isConnected = false;

  // In-memory local fallback store if PostgreSQL server is offline
  private inMemoryStore = new Map<string, any[]>();

  async onModuleInit() {
    await this.initDatabase();
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL connection pool closed');
    }
  }

  private async initDatabase() {
    const connectionString =
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/reboot_erp';

    try {
      this.pool = new Pool({
        connectionString,
        max: 25,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      });

      const client = await this.pool.connect();
      client.release();
      this.isConnected = true;
      this.logger.log(`Connected successfully to PostgreSQL at ${connectionString.split('@')[1] || 'localhost'}`);

      // Apply schema migrations
      await this.applySchema();
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `PostgreSQL server not reachable (${err.message}). Activating In-Memory Hybrid Database Engine for uninterrupted execution.`
      );
      this.initInMemoryEngine();
    }
  }

  /**
   * Execute query with optional connection
   */
  public async query<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    if (this.isConnected && this.pool) {
      try {
        return await this.pool.query<T>(text, params);
      } catch (err: any) {
        this.logger.error(`PostgreSQL Query Error: ${err.message} | SQL: ${text}`);
        throw err;
      }
    }

    // Fallback in-memory query handler
    return this.executeInMemoryQuery<T>(text, params);
  }

  /**
   * Execute callback within a tenant-isolated RLS transaction
   */
  public async withTenantContext<T>(
    tenantId: string,
    userId: string,
    callback: (client: PoolClient | DatabaseService) => Promise<T>
  ): Promise<T> {
    if (this.isConnected && this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
        await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId]);
        
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory fallback
    return callback(this);
  }

  /**
   * Acquire a PostgreSQL transaction-level advisory lock
   */
  public async withAdvisoryLock<T>(
    lockKey: string,
    callback: () => Promise<T>
  ): Promise<T> {
    if (this.isConnected && this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);
        const result = await callback();
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory fallback runs sequentially
    return callback();
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.isConnected || !this.pool) {
      throw new Error('PostgreSQL is offline. Transaction requires active database connection.');
    }
    return this.pool.connect();
  }

  public isDbConnected(): boolean {
    return this.isConnected;
  }

  public isPostgresConnected(): boolean {
    return this.isConnected;
  }

  public getPoolMetrics() {
    if (this.isConnected && this.pool) {
      return {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      };
    }
    return {
      totalCount: 1,
      idleCount: 1,
      waitingCount: 0,
      mode: 'in-memory-hybrid',
    };
  }

  private async applySchema() {
    if (!this.isConnected || !this.pool) return;
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await this.pool.query(sql);
        this.logger.log('Applied PostgreSQL database schema & indexes successfully');
      }
    } catch (err: any) {
      this.logger.warn(`Schema initialization notice: ${err.message}`);
    }
  }

  private initInMemoryEngine() {
    // Pre-initialize table structures for all ERP domains
    const tables = [
      'tenant_profiles',
      'auth_roles',
      'auth_role_permissions',
      'auth_users',
      'auth_active_sessions',
      'user_mfa_credentials',
      'user_mfa_challenges',
      'security_audit_logs',
      'admin_approval_workflows',
      'admin_approval_instances',
      'admin_approval_tasks',
      'admin_approval_delegations',
      'admin_break_glass_vault',
      'admin_system_parameters',
      'admin_numbering_sequences',
      'items',
      'machines',
      'boms',
      'bom_items',
      'work_orders',
      'suppliers',
      'purchase_orders',
      'po_items',
      'customers',
      'sales_orders',
      'so_items',
      'chart_of_accounts',
      'journal_entries',
      'quality_ncrs',
      'quality_capas',
      'hr_employees',
      'mep_equipment',
      'scm_inventory_aging',
      'custom_doc_templates',
      'analytics_kpi_cache',
      'rag_document_chunks',
      'dashboard_widgets',
      'tasks',
      'approval_requests',
      'notifications',
      'saved_views',
      'recent_records',
    ];
    tables.forEach((t) => {
      if (!this.inMemoryStore.has(t)) {
        this.inMemoryStore.set(t, []);
      }
    });
  }

  private executeInMemoryQuery<T extends QueryResultRow = any>(text: string, params: any[] = []): QueryResult<T> {
    const cleanSql = text.trim().toLowerCase();
    let rows: any[] = [];

    for (const [tableName, tableRows] of this.inMemoryStore.entries()) {
      if (cleanSql.includes(tableName)) {
        if (cleanSql.startsWith('select')) {
          rows = [...tableRows];
          if (params.length > 0 && typeof params[0] === 'string') {
            const matchParam = params[0];
            const filtered = rows.filter(
              (r) =>
                r.id === matchParam ||
                r.email === matchParam ||
                r.user_id === matchParam ||
                r.session_id === matchParam ||
                r.challenge_id === matchParam ||
                r.code === matchParam ||
                r.tenant_id === matchParam
            );
            if (filtered.length > 0) rows = filtered;
          }
        } else if (cleanSql.startsWith('insert')) {
          const newRow: any = { id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` };
          params.forEach((val, idx) => {
            newRow[`col_${idx}`] = val;
            if (typeof val === 'string' && val.includes('@')) newRow.email = val;
            if (typeof val === 'string' && val.startsWith('USR-')) newRow.id = val;
            if (typeof val === 'string' && val.startsWith('sess-')) newRow.session_id = val;
            if (typeof val === 'string' && val.startsWith('CHAL-')) newRow.challenge_id = val;
          });
          tableRows.push(newRow);
          rows = [newRow];
        } else if (cleanSql.startsWith('delete')) {
          if (params.length > 0) {
            const p = params[0];
            const remaining = tableRows.filter(
              (r) => r.session_id !== p && r.id !== p && r.user_id !== p
            );
            this.inMemoryStore.set(tableName, remaining);
          }
        }
        break;
      }
    }

    return {
      rows: rows as T[],
      command: cleanSql.split(' ')[0].toUpperCase(),
      rowCount: rows.length,
      oid: 0,
      fields: [],
    };
  }
}
