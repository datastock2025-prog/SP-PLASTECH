/**
 * Secure Token Storage & CSRF Protection
 * Keeps access tokens in memory (or httpOnly cookies) to prevent XSS exfiltration.
 * Implements Double Submit CSRF Cookie Pattern.
 */

class SecureTokenStorageManager {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private csrfToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.initCsrfToken();
  }

  /**
   * Initializes or reads CSRF token from document cookie
   */
  public initCsrfToken(): string {
    const existing = this.getCookie('XSRF-TOKEN');
    if (existing) {
      this.csrfToken = existing;
      return existing;
    }
    // Generate secure cryptographically random CSRF token
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    const newCsrf = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    this.setCookie('XSRF-TOKEN', newCsrf, 7, false);
    this.csrfToken = newCsrf;
    return newCsrf;
  }

  /**
   * Returns in-memory access token
   */
  public getAccessToken(): string | null {
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      return null;
    }
    return this.accessToken;
  }

  /**
   * Sets in-memory access token with short-lived TTL
   */
  public setAccessToken(token: string, expiresInSeconds = 900): void {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + (expiresInSeconds - 30) * 1000; // Refresh 30s before actual expiry
  }

  /**
   * Gets CSRF token for request header X-CSRF-Token
   */
  public getCsrfToken(): string {
    if (!this.csrfToken) {
      return this.initCsrfToken();
    }
    return this.csrfToken;
  }

  /**
   * Checks if access token is expired or close to expiry (<60s)
   */
  public isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry - 60000;
  }

  /**
   * Clears all client-side security tokens on logout
   */
  public clearTokens(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
    this.deleteCookie('XSRF-TOKEN');
    this.deleteCookie('erp_session');
  }

  /**
   * Safe cookie reader
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  /**
   * Safe cookie setter with SameSite=Strict & Secure in production
   */
  private setCookie(name: string, value: string, days = 7, isHttpOnly = false): void {
    if (typeof document === 'undefined') return;
    const isSecure = window.location.protocol === 'https:';
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Strict${
      isSecure ? '; Secure' : ''
    }`;
  }

  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  }
}

export const secureTokenStorage = new SecureTokenStorageManager();
