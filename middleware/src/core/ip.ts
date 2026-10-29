/**
 * Secure Client IP Extraction (S-02 Remediation)
 * Prevents IP spoofing via forged X-Forwarded-For or CF-Connecting-IP headers.
 */

export interface IpExtractionContext {
  header: (name: string) => string | undefined;
  raw?: any;
  env?: Record<string, any>;
}

export function extractClientIp(c: IpExtractionContext): string {
  // If running in Cloudflare Pages/Worker environment:
  const isCloudflare = Boolean(
    c.env?.CLOUDFLARE_WORKER ||
    process.env?.CLOUDFLARE_WORKER ||
    process.env?.CF_PAGES ||
    c.raw?.cf
  );

  if (isCloudflare) {
    const cfIp = c.header('cf-connecting-ip');
    if (cfIp) return cfIp.trim();
  }

  // If TRUST_PROXY is enabled (e.g. behind NGINX / Cloudflare edge), safely read headers
  const trustProxy = Boolean(process.env.TRUST_PROXY === 'true' || c.env?.TRUST_PROXY === 'true');
  if (trustProxy) {
    const cfIp = c.header('cf-connecting-ip');
    if (cfIp) return cfIp.trim();

    const xReal = c.header('x-real-ip');
    if (xReal) return xReal.trim();

    const xff = c.header('x-forwarded-for');
    if (xff) {
      const parts = xff.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        return parts[0];
      }
    }
  }

  // Direct socket IP if on Node
  const socketIp = c.raw?.socket?.remoteAddress;
  if (socketIp) {
    return socketIp === '::1' ? '127.0.0.1' : socketIp;
  }

  // Fallback for development/local
  return 'local';
}

