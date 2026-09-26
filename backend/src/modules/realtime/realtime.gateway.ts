import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisPubSubService } from '../../events/redis-pubsub.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly pubSub: RedisPubSubService) {
    // Listen for Redis PubSub events and broadcast to tenant rooms
    this.pubSub.subscribe('sp_events:all', (event: any) => {
      if (event.tenantId && this.server) {
        this.server.to(`tenant:${event.tenantId}`).emit(event.type, event.payload);
      }
    });
  }

  handleConnection(client: Socket) {
    const tenantId = (client.handshake.query.tenantId as string) || (client.handshake.headers['x-tenant-id'] as string);
    const userId = client.handshake.query.userId as string;

    if (tenantId) {
      client.join(`tenant:${tenantId}`);
      if (userId) {
        client.join(`user:${userId}`);
      }
      this.logger.log(`Client connected: ${client.id} [Tenant: ${tenantId}, User: ${userId || 'anon'}]`);
    } else {
      this.logger.log(`Client connected without explicit tenant: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_tenant')
  handleJoinTenant(@ConnectedSocket() client: Socket, @MessageBody() data: { tenantId: string }) {
    if (data.tenantId) {
      client.join(`tenant:${data.tenantId}`);
      return { status: 'joined', room: `tenant:${data.tenantId}` };
    }
  }

  /**
   * Broadcast Live OEE Machine status to tenant room
   */
  broadcastOeeUpdate(tenantId: string, machineData: { machineId: string; oee: number; status: string; unitsProduced: number }) {
    if (this.server) {
      this.server.to(`tenant:${tenantId}`).emit('oee_update', machineData);
    }
  }

  /**
   * Broadcast Low Stock Alert to tenant room
   */
  broadcastLowStockAlert(tenantId: string, alert: { itemId: string; itemCode: string; currentStock: number; minStock: number }) {
    if (this.server) {
      this.server.to(`tenant:${tenantId}`).emit('low_stock_alert', alert);
    }
  }

  /**
   * Send Approval Request Notification to specific user
   */
  sendApprovalNotification(userId: string, notification: { approvalId: string; title: string; entityType: string }) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('approval_required', notification);
    }
  }
}
