import { pool } from '../src/db.js';
import { verifyPassword } from '../src/hash.js';

async function main() {
  const users = await pool.query('SELECT id, name, email, username, "displayUsername" FROM "user"');
  console.log('Users:', users.rows);
  const accounts = await pool.query('SELECT id, "userId", "providerId", password FROM "account"');
  console.log('Accounts:', accounts.rows);
  if (accounts.rows[0]) {
    const ok = await verifyPassword(accounts.rows[0].password, 'Plas!Tech#Boot91');
    console.log('Password Plas!Tech#Boot91 match:', ok);
  }
  await pool.end();
}

main().catch(console.error);
