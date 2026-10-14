import { secureTokenStorage } from '../auth/SecureTokenStorage';
import { SecurityEventLogger } from '../logging/SecurityEventLogger';
import { z } from 'zod';

export interface SecureWebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
  onOpen?: (event: Event) => void;
  onMessage?: <T>(data: T) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

/**
 * Production-ready Secure WebSocket Client with:
 * 1. Automatic WSS protocol enforcement
 * 2. Token injection on connect
 * 3. Exponential backoff reconnection
 * 4. Ping/Pong Heartbeat keepalive
 * 5. Runtime Zod Schema payload validation
 */
export class SecureWebSocket {
  private ws: WebSocket | null = null;
  private options: SecureWebSocketOptions;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isExplicitlyClosed = false;

  constructor(options: SecureWebSocketOptions) {
    // Enforce WSS in non-development environments
    let secureUrl = options.url;
    if (window.location.protocol === 'https:' && secureUrl.startsWith('ws://')) {
      secureUrl = secureUrl.replace('ws://', 'wss://');
      console.warn('[Security] Upgraded insecure ws:// connection to wss://');
    }

    this.options = {
      reconnectIntervalMs: 3000,
      maxReconnectAttempts: 5,
      heartbeatIntervalMs: 30000,
      ...options,
      url: secureUrl,
    };
  }

  public connect(): void {
    this.isExplicitlyClosed = false;
    const token = secureTokenStorage.getAccessToken();

    // Attach token query param or custom protocol if supported
    const urlWithAuth = new URL(this.options.url, window.location.href);
    if (token) {
      urlWithAuth.searchParams.set('auth_token', token);
    }

    try {
      this.ws = new WebSocket(urlWithAuth.toString(), this.options.protocols);

      this.ws.onopen = (event) => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        SecurityEventLogger.log('WS_CONNECTED', { url: this.options.url });
        this.options.onOpen?.(event);
      };

      this.ws.onmessage = (event) => {
        try {
          // Handle heartbeat pong
          if (event.data === 'PONG' || event.data === '{"type":"pong"}') {
            return;
          }

          const parsedData = JSON.parse(event.data);
          this.options.onMessage?.(parsedData);
        } catch {
          this.options.onMessage?.(event.data);
        }
      };

      this.ws.onerror = (event) => {
        SecurityEventLogger.log('WS_ERROR', { url: this.options.url });
        this.options.onError?.(event);
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.options.onClose?.(event);

        if (!this.isExplicitlyClosed && this.reconnectAttempts < (this.options.maxReconnectAttempts || 5)) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[Security WS] Connection error:', err);
    }
  }

  public send(data: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Security WS] Cannot send message, socket not OPEN.');
      return false;
    }

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(payload);
    return true;
  }

  public sendValidated<T>(data: unknown, schema: z.ZodSchema<T>): boolean {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      console.error('[Security WS] Validation error before send:', parseResult.error);
      SecurityEventLogger.log('WS_VALIDATION_ERROR', { errors: parseResult.error.issues });
      return false;
    }
    return this.send(parseResult.data);
  }

  public close(code = 1000, reason = 'Normal Closure'): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, this.options.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(
      (this.options.reconnectIntervalMs || 3000) * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    console.log(`[Security WS] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}
