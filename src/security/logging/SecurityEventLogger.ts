import { SecurityEvent } from '../types';

type SecurityEventListener = (event: SecurityEvent) => void;

class SecurityEventLoggerClass {
  private inMemoryLogs: SecurityEvent[] = [];
  private listeners: Set<SecurityEventListener> = new Set();
  private maxLogs = 500;
  private batchEndpoint: string | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startPeriodicFlush();
  }

  public setBatchEndpoint(endpoint: string): void {
    this.batchEndpoint = endpoint;
  }

  public log(
    type: string,
    details?: Record<string, unknown>,
    severity: 'INFO' | 'WARN' | 'CRITICAL' = 'INFO',
    actorId?: string,
    tenantId?: string
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      actorId: actorId || 'current_user',
      tenantId: tenantId || 'tenant_default',
      ip: 'client_local',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      details: details || {},
    };

    this.inMemoryLogs.unshift(event);
    if (this.inMemoryLogs.length > this.maxLogs) {
      this.inMemoryLogs.pop();
    }

    // Notify real-time listeners (e.g. AuditTrailViewer)
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[SecurityEventLogger] Listener error:', err);
      }
    });

    if (severity === 'CRITICAL') {
      console.warn(`[SECURITY CRITICAL EVENT] [${type}]:`, details);
    }

    return event;
  }

  public getRecentLogs(limit = 100): SecurityEvent[] {
    return this.inMemoryLogs.slice(0, limit);
  }

  public clearLogs(): void {
    this.inMemoryLogs = [];
  }

  public subscribe(listener: SecurityEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private startPeriodicFlush(): void {
    if (typeof window === 'undefined') return;
    this.flushTimer = setInterval(() => {
      this.flushLogsToServer();
    }, 60000); // every minute
  }

  private async flushLogsToServer(): Promise<void> {
    if (!this.batchEndpoint || this.inMemoryLogs.length === 0) return;
    try {
      const logsToSend = [...this.inMemoryLogs];
      await fetch(this.batchEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: logsToSend }),
      });
    } catch {
      // Ignore background flush failures
    }
  }
}

export const SecurityEventLogger = new SecurityEventLoggerClass();
