import { hashPassword } from '../src/hash.js';
import pg from 'pg';

const p = new pg.Pool({ host: 'localhost', port: 54329, user: 'postgres', password: 'postgres', database: 'reboot_auth' });
const h = await hashPassword(process.argv[2]);
const r = await p.query(`UPDATE "account" SET password = $1 WHERE "providerId" = 'credential'`, [h]);
await p.query(`UPDATE user_profiles SET failed_login_attempts = 0`);
console.log('updated', r.rowCount);
await p.end();
