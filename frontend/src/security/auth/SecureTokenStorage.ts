/**
 * Secure Token Storage Adapter
 * In compliance with ERP Enterprise rules, session auth cookies (httpOnly) are managed by the server.
 * This class provides zero-persistence in-memory stubs for backwards compatibility without client persistence.
 */

export class SecureTokenStorage {
  private inMemoryToken: string | null = null;
  private csrfToken: string | null = null;

  getAccessToken(): string | null {
    return this.inMemoryToken;
  }

  setAccessToken(token: string): void {
    this.inMemoryToken = token;
  }

  getRefreshToken(): string | null {
    return null;
  }

  getCsrfToken(): string | null {
    return this.csrfToken;
  }

  setCsrfToken(token: string): void {
    this.csrfToken = token;
  }

  setTokens(accessToken: string, _refreshToken?: string): void {
    this.inMemoryToken = accessToken;
  }

  clearTokens(): void {
    this.inMemoryToken = null;
    this.csrfToken = null;
  }

  hasValidToken(): boolean {
    return Boolean(this.inMemoryToken);
  }
}

export const secureTokenStorage = new SecureTokenStorage();
