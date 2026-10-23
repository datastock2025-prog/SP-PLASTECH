// Event emitter for cross-module reactive synchronization
export type AdminEventListener = (event: string, payload?: any) => void;

export class AdminEventBus {
  private listeners: AdminEventListener[] = [];
  private eventHandlers: Map<string, Set<(payload?: any) => void>> = new Map();

  subscribe(listener: AdminEventListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  on(event: string, callback: (payload?: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);
    return () => {
      this.eventHandlers.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: (payload?: any) => void) {
    this.eventHandlers.get(event)?.delete(callback);
  }

  emit(event: string, payload?: any) {
    this.listeners.forEach((l) => {
      try {
        l(event, payload);
      } catch (err) {
        console.error('Error in admin event listener', err);
      }
    });

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in admin event handler for ${event}`, err);
        }
      });
    }
  }
}

export const adminEventBus = new AdminEventBus();
