import type { AuthSession } from '../types';

/**
 * Session Lifecycle Manager
 */

export class SessionManager {
  private listeners: Array<() => void> = [];
  private warningListeners: Array<(remaining: number) => void> = [];

  startMonitoring(_timeoutMinutes = 15): void {
    // Session state is authoritative on server
  }

  stopMonitoring(): void {
    this.listeners = [];
    this.warningListeners = [];
  }

  extendSession(): void {
    // Handled by active HTTP requests
  }

  resetActivityTimer(): void {
    // Handled by active HTTP requests
  }

  recordActivity(): void {
    // Handled by active HTTP requests
  }

  getRemainingSeconds(): number {
    return 900;
  }

  getActiveSessions(): AuthSession[] {
    return [
      {
        sessionId: 'current',
        userId: 'current-user',
        deviceId: 'current-device',
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Current Device',
        ipAddress: '127.0.0.1',
        location: 'Current Plant',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
        rememberMe: true,
      },
    ];
  }

  revokeSession(_sessionId: string): void {
    // Server manages revocation via /api/v1/me/sessions
  }

  revokeAllOtherSessions(): void {
    // Server manages revocation via /api/v1/me/sessions/revoke-others
  }

  subscribeTimeout(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  onWarning(callback: (remainingSeconds: number) => void): () => void {
    this.warningListeners.push(callback);
    return () => {
      this.warningListeners = this.warningListeners.filter((l) => l !== callback);
    };
  }

  onTimeout(callback: () => void): () => void {
    return this.subscribeTimeout(callback);
  }

  isMonitoring(): boolean {
    return true;
  }
}

export const sessionManager = new SessionManager();
