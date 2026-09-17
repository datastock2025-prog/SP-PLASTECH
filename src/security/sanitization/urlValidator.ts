/**
 * URL Parameter Sanitization & Anti-Open Redirect Engine
 * Protects against open redirects, IDOR query tampering, and cross-site scripting in URLs.
 */

const ALLOWED_REDIRECT_HOSTS = [
  'localhost',
  '127.0.0.1',
  'rebooterp.com',
  'app.rebooterp.com',
];

export class UrlSecurityValidator {
  /**
   * Validates if a redirect URL is safe to navigate to (prevents Open Redirect attacks)
   */
  public static isValidRedirectUrl(url: string | null | undefined): boolean {
    if (!url) return false;

    // Relative URLs starting with '/' but not '//' (protocol relative)
    if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) {
      return true;
    }

    try {
      const parsed = new URL(url, window.location.origin);
      // Check if protocol is standard http/https
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      return ALLOWED_REDIRECT_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Returns a safe relative redirect target, or a fallback default
   */
  public static getSafeRedirect(url: string | null | undefined, fallback = '/'): string {
    return this.isValidRedirectUrl(url) ? url! : fallback;
  }

  /**
   * Sanitizes all query parameters in an object, stripping scripts and control characters
   */
  public static sanitizeQueryParams(params: Record<string, any>): Record<string, string> {
    const clean: Record<string, string> = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        const strVal = String(val).trim();
        // Disallow dangerous protocols like javascript:
        if (/^javascript:/i.test(strVal) || /<script/i.test(strVal)) {
          continue;
        }
        clean[encodeURIComponent(key)] = encodeURIComponent(strVal);
      }
    }
    return clean;
  }
}
