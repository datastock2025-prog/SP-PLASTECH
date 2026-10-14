const crypto = require('node:crypto');
const { Client } = require('pg');

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
  const pw = 'Plas!Tech#Boot91';
  const hashed = await hashPassword(pw);
  const c = new Client({ connectionString: 'postgres://erp:erp_local_only@172.18.214.127:5432/erp' });
  await c.connect();
  await c.query(`UPDATE "account" SET password = $1`, [hashed]);
  await c.query(`UPDATE user_profiles SET status = 'ACTIVE', failed_login_attempts = 0, must_change_password = false`);
  console.log('✅ Admin successfully unlocked! Password set to:', pw);
  await c.end();
}

run().catch((e) => {
  console.error('Error unlocking admin:', e);
  process.exit(1);
});
