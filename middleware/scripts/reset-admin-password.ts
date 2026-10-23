import { pool } from '../src/db.js';
import { hashPassword, verifyPassword } from '../src/hash.js';

async function main() {
  const newHash = await hashPassword('Plas!Tech#Boot91');
  const res = await pool.query(
    'UPDATE "account" SET password = $1 WHERE "providerId" = \'credential\' RETURNING id, "userId"',
    [newHash]
  );
  console.log('Updated accounts:', res.rows);
  const ok = await verifyPassword(newHash, 'Plas!Tech#Boot91');
  console.log('Verified match:', ok);
  await pool.end();
}

main().catch(console.error);
