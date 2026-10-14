/**
 * Session Manager with Idle Timeout Detection & Multi-Device Session Control
 * Detects user inactivity, displays 30-second warning countdown, and manages active device sessions.
 */

import { AuthSession } from '../types';

export type SessionWarningCallback = (secondsRemaining: number) => void;
export type SessionTimeoutCallback = () => void;

class SessionManager {
  private idleTimeoutMs = 15 * 60 * 1000; // 15 minutes default
  private warningThresholdMs = 30 * 1000; // 30 seconds before timeout
  private lastActivityTimestamp = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;
  private isWarningActive = false;

  private onWarningListeners: Set<SessionWarningCallback> = new Set();
  private onTimeoutListeners: Set<SessionTimeoutCallback> = new Set();

  private activeSessions: AuthSession[] = [
    {
      sessionId: 'sess-curr-01',
      userId: 'USR-ADMIN-01',
      deviceId: 'dev-chrome-win',
      deviceInfo: 'Chrome 128 / Windows 11 (Current)',
      ipAddress: '103.21.144.68',
      location: 'Pune, Maharashtra, IN',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      lastActiveAt: new Date().toISOString(),
      isCurrent: true,
      rememberMe: true,
    },
    {
      sessionId: 'sess-mob-02',
      userId: 'USR-ADMIN-01',
      deviceId: 'dev-safari-ios',
      deviceInfo: 'Safari / iPhone 15 Pro',
      ipAddress: '49.37.112.45',
      location: 'Mumbai, Maharashtra, IN',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastActiveAt: new Date(Date.now() - 7200000).toISOString(),
      isCurrent: false,
      rememberMe: false,
    },
  ];

  constructor() {
    this.attachActivityListeners();
    this.startMonitoring(15);
  }

  public startMonitoring(idleMinutes = 15): void {
    this.idleTimeoutMs = idleMinutes * 60 * 1000;
    this.resetActivityTimer();

    if (this.checkInterval) clearInterval(this.checkInterval);

    this.checkInterval = setInterval(() => {
      this.evaluateSessionState();
    }, 1000);
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isWarningActive = false;
  }

  public resetActivityTimer(): void {
    this.lastActivityTimestamp = Date.now();
    if (this.isWarningActive) {
      this.isWarningActive = false;
    }
  }

  public recordActivity(): void {
    this.resetActivityTimer();
  }

  public getRemainingSeconds(): number {
    const elapsed = Date.now() - this.lastActivityTimestamp;
    const remainingMs = Math.max(0, this.idleTimeoutMs - elapsed);
    return Math.ceil(remainingMs / 1000);
  }

  public onWarning(cb: SessionWarningCallback): () => void {
    this.onWarningListeners.add(cb);
    return () => this.onWarningListeners.delete(cb);
  }

  public onTimeout(cb: SessionTimeoutCallback): () => void {
    this.onTimeoutListeners.add(cb);
    return () => this.onTimeoutListeners.delete(cb);
  }

  public subscribeWarning(cb: SessionWarningCallback): () => void {
    return this.onWarning(cb);
  }

  public subscribeTimeout(cb: SessionTimeoutCallback): () => void {
    return this.onTimeout(cb);
  }

  public getActiveSessions(): AuthSession[] {
    return this.activeSessions;
  }

  public revokeSession(sessionId: string): void {
    this.activeSessions = this.activeSessions.filter((s) => s.sessionId !== sessionId);
  }

  public revokeAllOtherSessions(): void {
    this.activeSessions = this.activeSessions.filter((s) => s.isCurrent);
  }

  private evaluateSessionState(): void {
    const elapsed = Date.now() - this.lastActivityTimestamp;
    const remainingMs = this.idleTimeoutMs - elapsed;

    if (remainingMs <= 0) {
      this.triggerTimeout();
    } else if (remainingMs <= this.warningThresholdMs) {
      this.isWarningActive = true;
      const secondsLeft = Math.ceil(remainingMs / 1000);
      this.onWarningListeners.forEach((cb) => cb(secondsLeft));
    }
  }

  private triggerTimeout(): void {
    this.stopMonitoring();
    this.onTimeoutListeners.forEach((cb) => cb());
  }

  private attachActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const throttleActivity = this.throttle(() => {
      if (!this.isWarningActive) {
        this.resetActivityTimer();
      }
    }, 1000);

    events.forEach((evt) => {
      window.addEventListener(evt, throttleActivity, { passive: true });
    });
  }

  private throttle(fn: Function, limit: number) {
    let inThrottle = false;
    return (...args: any[]) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

export const sessionManager = new SessionManager();
