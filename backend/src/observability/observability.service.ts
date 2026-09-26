import { Injectable, Logger } from '@nestjs/common';

export interface SpanContext {
  spanId: string;
  traceId: string;
  name: string;
  startTime: number;
}

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger('SP-PLASTECH-Observability');
  private metricsStore: Map<string, number> = new Map();

  /**
   * Start OpenTelemetry tracing span
   */
  public startSpan(spanName: string): SpanContext {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const spanId = `span-${Math.random().toString(36).substring(2, 9)}`;
    return {
      traceId,
      spanId,
      name: spanName,
      startTime: performance.now(),
    };
  }

  /**
   * End OpenTelemetry tracing span and record Prometheus duration
   */
  public endSpan(span: SpanContext, isSuccess: boolean = true, error?: Error): void {
    const durationMs = performance.now() - span.startTime;
    this.recordMetric(`db_query_duration_ms_${span.name}`, durationMs);
    this.recordMetric(`db_query_count_${span.name}_${isSuccess ? 'success' : 'error'}`, 1);

    if (!isSuccess && error) {
      this.logger.error(
        `[Span Failed] ${span.name} (TraceID: ${span.traceId}) Duration: ${durationMs.toFixed(2)}ms - Error: ${error.message}`
      );
    } else {
      this.logger.debug(
        `[Span OK] ${span.name} (TraceID: ${span.traceId}) Duration: ${durationMs.toFixed(2)}ms`
      );
    }
  }

  /**
   * Prometheus Metric Counter / Gauge increment
   */
  public recordMetric(name: string, value: number): void {
    const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
    const prev = this.metricsStore.get(sanitized) || 0;
    this.metricsStore.set(sanitized, prev + value);
  }

  /**
   * Output Prometheus-compatible text format metrics
   */
  public getPrometheusMetrics(): string {
    const lines: string[] = ['# HELP sp_plastech_erp_metrics Enterprise Metrics', '# TYPE sp_plastech_erp_metrics counter'];
    for (const [key, val] of this.metricsStore.entries()) {
      lines.push(`${key} ${val}`);
    }
    return lines.join('\n');
  }
}
