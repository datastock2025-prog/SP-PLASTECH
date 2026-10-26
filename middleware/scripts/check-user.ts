import { pool } from '../src/db.js';
import { verifyPassword } from '../src/hash.js';

async function main() {
  const users = await pool.query('SELECT id, name, email, username, "displayUsername" FROM "user"');
  console.log('Users:', users.rows);
  const accounts = await pool.query('SELECT id, "userId", "providerId", password FROM "account"');
  console.log('Accounts:', accounts.rows);
  if (accounts.rows[0]) {
    const ok = await verifyPassword({ hash: accounts.rows[0].password, password: 'Plas!Tech#Boot91' });
    console.log('Password Plas!Tech#Boot91 match:', ok);
  }
  const profiles = await pool.query('SELECT user_id, must_change_password, full_name, failed_login_attempts, last_login_at FROM user_profiles');
  console.log('Profiles:', profiles.rows);
  const history = await pool.query('SELECT id, user_id, created_at FROM user_password_history ORDER BY created_at DESC');
  console.log('Password History entries:', history.rows);
  const audits = await pool.query("SELECT id, entity_type, action, performed_by, performed_at, new_values FROM audit_logs WHERE entity_type = 'user' ORDER BY performed_at DESC");
  console.log('User Audits:', audits.rows);
  await pool.end();
}

main().catch(console.error);
