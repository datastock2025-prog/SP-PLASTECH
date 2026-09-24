import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface Span {
  name: string;
  traceId: string;
  spanId: string;
  startTime: number;
  attributes: Record<string, any>;
  status?: { code: number; message?: string };
}

@Injectable()
export class TracingService {
  private activeSpans = new Map<string, Span>();

  public startSpan(name: string, attributes: Record<string, any> = {}): Span {
    const traceId = attributes['trace.id'] || `trace-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const spanId = `span-${crypto.randomBytes(4).toString('hex')}`;
    const span: Span = {
      name,
      traceId,
      spanId,
      startTime: Date.now(),
      attributes,
    };
    this.activeSpans.set(spanId, span);
    return span;
  }

  public endSpan(span: Span, error?: Error) {
    const durationMs = Date.now() - span.startTime;
    span.attributes['duration_ms'] = durationMs;
    if (error) {
      span.status = { code: 2, message: error.message };
    } else {
      span.status = { code: 1, message: 'OK' };
    }
    this.activeSpans.delete(span.spanId);
  }

  public async traceOperation<T>(
    name: string,
    operation: () => Promise<T>,
    attributes: Record<string, any> = {}
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    try {
      const result = await operation();
      this.endSpan(span);
      return result;
    } catch (err: any) {
      this.endSpan(span, err);
      throw err;
    }
  }
}
