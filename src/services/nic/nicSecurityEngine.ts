// ============================================================================
// NIC Cryptography, Security & Sensitive Data Masking Engine
// Simulates NIC-mandated symmetric AES-256 GCM / CBC encryption & RSA Session Keys
// ============================================================================

import { NicCredentials, NicAuthResponse } from '../../types/nicEwbTypes';

class NicSecurityEngine {
  private activeToken: string | null = null;
  private tokenExpiry: number | null = null;
  private sessionKey: string | null = null;

  /**
   * Generates a 32-byte hexadecimal AppKey for GSP authentication handshake
   */
  public generateAppKey(): string {
    const chars = '0123456789ABCDEF';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  /**
   * Store active session token with expiration timestamp
   */
  public storeAuthSession(authResponse: NicAuthResponse): void {
    if (authResponse.status === '1' && authResponse.data) {
      this.activeToken = authResponse.data.authToken;
      this.sessionKey = authResponse.data.sek;
      const expiryMinutes = authResponse.data.tokenExpiryMinutes || 360;
      this.tokenExpiry = Date.now() + expiryMinutes * 60 * 1000;
    }
  }

  /**
   * Check whether the active token is valid and not expired
   */
  public isTokenValid(): boolean {
    if (!this.activeToken || !this.tokenExpiry) return false;
    // Buffer of 60 seconds before actual expiration
    return Date.now() < (this.tokenExpiry - 60000);
  }

  /**
   * Get currently active token or null if expired
   */
  public getActiveToken(): string | null {
    if (this.isTokenValid()) {
      return this.activeToken;
    }
    return null;
  }

  /**
   * Clears active session (useful for simulating token expiry in TEST-007)
   */
  public invalidateToken(): void {
    this.activeToken = null;
    this.tokenExpiry = null;
    this.sessionKey = null;
  }

  /**
   * Force set an expired token to test re-authentication flow
   */
  public setExpiredToken(): void {
    this.activeToken = 'EXPIRED_NIC_TOKEN_SIM_9999';
    this.tokenExpiry = Date.now() - 10000;
  }

  /**
   * Masks sensitive credentials before returning in logs or UI inspection
   */
  public maskCredentials(creds: NicCredentials): Partial<NicCredentials> {
    return {
      gstin: creds.gstin ? `${creds.gstin.slice(0, 2)}••••••••${creds.gstin.slice(-3)}` : 'N/A',
      username: creds.username ? `${creds.username.slice(0, 2)}••••••` : 'N/A',
      clientId: creds.clientId ? `${creds.clientId.slice(0, 4)}••••••` : 'N/A',
      environment: creds.environment,
      apiEndpoint: creds.apiEndpoint,
    };
  }

  /**
   * Masks authorization token for safe display
   */
  public maskToken(token: string): string {
    if (!token || token.length < 8) return '••••';
    return `${token.slice(0, 6)}••••••••${token.slice(-4)}`;
  }

  /**
   * Simulates AES-256 payload encryption envelope
   */
  public encryptPayload(data: any): string {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    try {
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch {
      return btoa(jsonStr);
    }
  }

  /**
   * Simulates AES-256 payload decryption envelope
   */
  public decryptPayload(encryptedBase64: string): any {
    try {
      const decoded = decodeURIComponent(escape(atob(encryptedBase64)));
      return JSON.parse(decoded);
    } catch {
      return { raw: encryptedBase64 };
    }
  }
}

export const nicSecurityEngine = new NicSecurityEngine();
