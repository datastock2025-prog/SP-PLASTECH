// Password hashing on Web Crypto (PBKDF2-SHA256) so the same code runs on Node
// and on Cloudflare Workers. 100k iterations is the Workers platform maximum.
const ITERATIONS = 100_000;
const enc = new TextEncoder();

const toHex = (b: ArrayBuffer | Uint8Array) =>
  Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
const fromHex = (h: string) => new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16)));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(await derive(password, salt, ITERATIONS))}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  try {
    const [scheme, iter, salt, expected] = hash.split('$');
    if (scheme !== 'pbkdf2' || !iter || !salt || !expected) return false;
    const got = toHex(await derive(password, fromHex(salt), Number(iter)));
    let diff = got.length ^ expected.length;
    for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ (expected.charCodeAt(i) || 0);
    return diff === 0;
  } catch {
    return false;
  }
}
