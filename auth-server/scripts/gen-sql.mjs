import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sql = readFileSync(resolve(root, 'sql', '001_identity.sql'), 'utf8').replace(/\r\n/g, '\n');
writeFileSync(
  resolve(root, 'src', 'identitySql.ts'),
  `// GENERATED from sql/001_identity.sql by \`npm run gen:sql\` - do not edit.\nexport const identitySql = \`${sql}\`;\n`,
);
