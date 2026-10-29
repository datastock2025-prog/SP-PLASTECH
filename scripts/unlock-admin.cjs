const crypto = require('node:crypto');
const { Client } = require('pg');

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run unlock-admin script in production environment.');
  process.exit(1);
}

const ITERATIONS = 100_000;
const enc = new TextEncoder();
const toHex = (b) => Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

async function hashPassword(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(pw.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(bits)}`;
}

async function run() {
  const targetEmail = process.argv[2] || process.env.TARGET_ADMIN_EMAIL || 'admin@sp-plastech.com';
  const pw = process.argv[3] || process.env.TARGET_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!pw) {
    console.error('Usage: node scripts/unlock-admin.cjs [email] [password]');
    console.error('Or set TARGET_ADMIN_PASSWORD / BOOTSTRAP_ADMIN_PASSWORD env var.');
    process.exit(1);
  }

  const hashed = await hashPassword(pw);
  const connStr = process.env.DATABASE_URL || 'postgres://erp:erp_local_only@127.0.0.1:5432/erp';
  const c = new Client({ connectionString: connStr });
  await c.connect();

  const accountRes = await c.query(
    `UPDATE "account" SET password = $1 WHERE "userId" IN (SELECT id FROM "user" WHERE email = $2)`,
    [hashed, targetEmail]
  );
  const profileRes = await c.query(
    `UPDATE user_profiles SET status = 'ACTIVE', failed_login_attempts = 0, must_change_password = false WHERE email = $1`,
    [targetEmail]
  );

  console.log(`✅ User [${targetEmail}] updated safely: account rows=${accountRes.rowCount}, profile rows=${profileRes.rowCount}`);
  await c.end();
}

run().catch((e) => {
  console.error('Error unlocking admin:', e.message);
  process.exit(1);
});
