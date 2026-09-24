import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ObservabilityLogger implements LoggerService {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (e) {
        // Ignore if directory creation fails in restricted environments
      }
    }
    this.logFile = path.join(this.logDir, 'app.log');
  }

  private formatEntry(level: string, message: any, ...optionalParams: any[]) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      context: optionalParams.length > 0 ? optionalParams : undefined,
      service: 'sp-plastech-erp',
      environment: process.env.NODE_ENV || 'production',
    };
    return JSON.stringify(payload);
  }

  private writeToFile(formatted: string) {
    try {
      fs.appendFileSync(this.logFile, formatted + '\n');
    } catch (e) {
      // Fallback
    }
  }

  log(message: any, ...optionalParams: any[]) {
    const formatted = this.formatEntry('INFO', message, ...optionalParams);
    console.log(formatted);
    this.writeToFile(formatted);
  }

  error(message: any, ...optionalParams: any[]) {
    const formatted = this.formatEntry('ERROR', message, ...optionalParams);
    console.error(formatted);
    this.writeToFile(formatted);
  }

  warn(message: any, ...optionalParams: any[]) {
    const formatted = this.formatEntry('WARN', message, ...optionalParams);
    console.warn(formatted);
    this.writeToFile(formatted);
  }

  debug(message: any, ...optionalParams: any[]) {
    const formatted = this.formatEntry('DEBUG', message, ...optionalParams);
    console.debug(formatted);
    this.writeToFile(formatted);
  }

  verbose(message: any, ...optionalParams: any[]) {
    const formatted = this.formatEntry('VERBOSE', message, ...optionalParams);
    console.log(formatted);
    this.writeToFile(formatted);
  }

  logAudit(event: {
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    details?: any;
  }) {
    const formatted = this.formatEntry('AUDIT', event);
    console.log(formatted);
    this.writeToFile(formatted);
  }

  logMetric(name: string, value: number, unit: string, tags?: Record<string, string>) {
    const formatted = this.formatEntry('METRIC', { name, value, unit, tags });
    console.log(formatted);
    this.writeToFile(formatted);
  }

  logTrace(traceId: string, spanId: string, operation: string, durationMs: number) {
    const formatted = this.formatEntry('TRACE', { traceId, spanId, operation, durationMs });
    console.log(formatted);
    this.writeToFile(formatted);
  }

  logAlert(severity: string, message: string, context?: any) {
    const formatted = this.formatEntry('ALERT', { severity, message, context });
    console.warn(formatted);
    this.writeToFile(formatted);
  }

  logQuery(query: string, durationMs: number, tenantId?: string) {
    const formatted = this.formatEntry('QUERY', { query, durationMs, tenantId });
    console.log(formatted);
    this.writeToFile(formatted);
  }
}
