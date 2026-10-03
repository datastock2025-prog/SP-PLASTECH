import { db } from '../../shared/db';
import { checkSupabaseConnection } from '../../shared/supabaseClient';
import { adminEventBus } from '../adminService';

export type SyncDomain =
  | 'SALES_ORDERS'
  | 'MONTHLY_PLANS'
  | 'DELIVERIES'
  | 'WORK_ORDERS'
  | 'ITEMS'
  | 'PURCHASE_ORDERS'
  | 'QUALITY_NCRS'
  | 'QUALITY_CAPAS'
  | 'QUALITY_COAS'
  | 'CUSTOMERS'
  | 'QUOTATIONS'
  | 'RMAS'
  | 'BOMS'
  | 'MACHINES'
  | 'ACCOUNTS'
  | 'JOURNAL_ENTRIES'
  | 'USERS'
  | 'SYSTEM_SETTINGS';

export interface SyncMessage<T = any> {
  domain: SyncDomain;
  table?: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'RELOAD';
  data: T;
  sourceClient: string;
  timestamp: number;
}

export class UniversalSyncManager {
  private static instance: UniversalSyncManager;
  private broadcastChannel: BroadcastChannel | null = null;
  private clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  private isConnected = false;
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private healthCheckTimer: any = null;

  private constructor() {
    this.initBroadcastChannel();
    this.initRealtimeSubscriptions();
    this.startHealthChecks();
  }

  public static getInstance(): UniversalSyncManager {
    if (!UniversalSyncManager.instance) {
      UniversalSyncManager.instance = new UniversalSyncManager();
    }
    return UniversalSyncManager.instance;
  }

  // --------------------------------------------------------------------------
  // 1. Cross-Tab Sync (Same Device / Browser via BroadcastChannel)
  // --------------------------------------------------------------------------
  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('sp_plastech_realtime_mesh');
        this.broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
          if (event.data && event.data.sourceClient !== this.clientId) {
            this.dispatchToLocalEcosystem(event.data);
          }
        };
      } catch (err) {
        console.warn('[SyncManager] BroadcastChannel initialization skipped:', err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Cross-Browser & Multi-Workstation Sync (via Database Adapter Realtime)
  // --------------------------------------------------------------------------
  private initRealtimeSubscriptions() {
    const tableMap: Array<{ table: string; domain: SyncDomain }> = [
      { table: 'sales_orders', domain: 'SALES_ORDERS' },
      { table: 'monthly_plan_orders', domain: 'MONTHLY_PLANS' },
      { table: 'work_orders', domain: 'WORK_ORDERS' },
      { table: 'items', domain: 'ITEMS' },
      { table: 'purchase_orders', domain: 'PURCHASE_ORDERS' },
      { table: 'quality_ncrs', domain: 'QUALITY_NCRS' },
      { table: 'quality_capas', domain: 'QUALITY_CAPAS' },
      { table: 'quality_coas', domain: 'QUALITY_COAS' },
      { table: 'customers', domain: 'CUSTOMERS' },
      { table: 'quotations', domain: 'QUOTATIONS' },
      { table: 'users', domain: 'USERS' },
    ];

    try {
      tableMap.forEach(({ table, domain }) => {
        db.subscribeToChanges(table, (payload) => {
          this.handleRealtimeEvent(domain, payload);
        });
      });
      this.setConnectionState(true);
    } catch (err) {
      console.warn('[SyncManager] Realtime subscription skipped:', err);
    }
  }

  private handleRealtimeEvent(domain: SyncDomain, payload: any) {
    const data = payload.new || payload.old || payload.record || payload;
    const syncMsg: SyncMessage = {
      domain,
      table: payload.table,
      eventType: (payload.eventType as any) || (payload.type as any) || 'UPDATE',
      data,
      sourceClient: 'DATABASE_GATEWAY',
      timestamp: Date.now(),
    };
    this.dispatchToLocalEcosystem(syncMsg);
    // Forward to other tabs as well
    try {
      this.broadcastChannel?.postMessage(syncMsg);
    } catch {}
  }

  private dispatchToLocalEcosystem(syncMsg: SyncMessage) {
    adminEventBus.emit(`${syncMsg.domain}_SYNCED`, syncMsg);
    adminEventBus.emit('ENTERPRISE_SYNC_EVENT', syncMsg);
  }

  // --------------------------------------------------------------------------
  // 3. Local Mutation Broadcaster
  // --------------------------------------------------------------------------
  public broadcastMutation<T>(domain: SyncDomain, eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'RELOAD', data: T) {
    const syncMsg: SyncMessage<T> = {
      domain,
      eventType,
      data,
      sourceClient: this.clientId,
      timestamp: Date.now(),
    };

    // 1. Notify current tab's React state
    adminEventBus.emit(`${domain}_MUTATED`, syncMsg);
    adminEventBus.emit('ENTERPRISE_SYNC_EVENT', syncMsg);

    // 2. Notify other tabs on the same machine
    try {
      this.broadcastChannel?.postMessage(syncMsg);
    } catch {}
  }

  // --------------------------------------------------------------------------
  // 4. Connection State & Health Checks (For Topbar Green/Red Dot)
  // --------------------------------------------------------------------------
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private setConnectionState(connected: boolean) {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      this.connectionListeners.forEach((cb) => cb(connected));
    }
  }

  private startHealthChecks() {
    // Initial quick check
    checkSupabaseConnection().then((res) => {
      this.setConnectionState(res.connected || (typeof navigator !== 'undefined' && navigator.onLine));
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setConnectionState(true));
      window.addEventListener('offline', () => this.setConnectionState(false));

      // Periodic check every 15 seconds
      this.healthCheckTimer = setInterval(async () => {
        if (!navigator.onLine) {
          this.setConnectionState(false);
          return;
        }
        const res = await checkSupabaseConnection();
        this.setConnectionState(res.connected || navigator.onLine);
      }, 15000);
    }
  }
}

export const universalSyncManager = UniversalSyncManager.getInstance();
