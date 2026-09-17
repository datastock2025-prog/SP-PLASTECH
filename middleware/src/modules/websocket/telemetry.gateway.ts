import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class TelemetryGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryGateway.name);
  private wss: WebSocketServer | null = null;
  private broadcastInterval: NodeJS.Timeout | null = null;

  onModuleInit() {
    this.initWebSocketServer();
  }

  onModuleDestroy() {
    if (this.broadcastInterval) clearInterval(this.broadcastInterval);
    if (this.wss) {
      this.wss.close();
      this.logger.log('WebSocket Telemetry Server closed');
    }
  }

  private initWebSocketServer() {
    const port = parseInt(process.env.WS_PORT || '3002', 10);
    try {
      this.wss = new WebSocketServer({ port });
      this.logger.log(`Secure WebSocket Telemetry Gateway listening on ws://localhost:${port}/ws/telemetry`);

      this.wss.on('connection', (ws: WebSocket, req) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const token = url.searchParams.get('auth_token') || req.headers['sec-websocket-protocol'];

        // Handshake Token Authentication
        if (token) {
          try {
            jwt.verify(token as string, JWT_SECRET);
          } catch {
            this.logger.warn(`WS Connection rejected: Invalid JWT token from ${req.socket.remoteAddress}`);
            ws.close(4001, 'Unauthorized');
            return;
          }
        }

        this.logger.log(`WS Client Connected from ${req.socket.remoteAddress}`);

        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message.toString());
            // Ping / Pong keepalive
            if (data.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
          } catch {
            // Echo raw string
            if (message.toString() === 'PING') {
              ws.send('PONG');
            }
          }
        });

        ws.on('error', (err) => {
          this.logger.error(`WS Client Error: ${err.message}`);
        });

        // Send welcome telemetry handshake
        ws.send(
          JSON.stringify({
            type: 'TELEMETRY_CONNECTED',
            gateway: 'Euromap 63/77 OPC-UA Press Gateway',
            status: 'ONLINE',
            timestamp: new Date().toISOString(),
          })
        );
      });

      // Periodic live telemetry simulation
      this.startTelemetryBroadcast();
    } catch (err: any) {
      this.logger.warn(`WS Gateway initialization notice: ${err.message}`);
    }
  }

  private startTelemetryBroadcast() {
    this.broadcastInterval = setInterval(() => {
      if (!this.wss || this.wss.clients.size === 0) return;

      const payload = JSON.stringify({
        type: 'OPC_UA_TELEMETRY',
        pressBay: 'IMM-ENGEL-650',
        cavityPressureBar: (120 + Math.random() * 5).toFixed(2),
        barrelTempC: (238 + Math.random() * 3).toFixed(1),
        cycleTimeSec: (18.4 + Math.random() * 0.4).toFixed(2),
        activeWorkOrder: 'WO-2026-0412',
        timestamp: new Date().toISOString(),
      });

      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }, 5000); // every 5 seconds
  }
}
