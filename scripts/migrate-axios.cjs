const fs = require('fs');
const path = require('path');

const targetFiles = [
  'frontend/src/services/analytics/analytics.api.ts',
  'frontend/src/services/administration/administration.api.ts',
  'frontend/src/services/operations/operations.api.ts',
  'frontend/src/services/front-office/front-office.api.ts',
  'frontend/src/services/home-tools/api/home-tools.api.ts',
  'frontend/src/services/hr/hr.api.ts',
  'frontend/src/services/planning/planning.api.ts',
  'frontend/src/services/procurement/procurement.api.ts',
  'frontend/src/services/finance/finance.api.ts',
];

for (const relPath of targetFiles) {
  const absPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(absPath)) {
    console.log(`Skipping non-existent ${relPath}`);
    continue;
  }

  let code = fs.readFileSync(absPath, 'utf8');

  // Replace import
  const depth = relPath.includes('/home-tools/api/') ? '../../../shared/api/http' : '../../shared/api/http';
  code = code.replace(/import axios(?:, \{[^}]*\})? from 'axios';/g, `import { createHttpClient, type HttpClient } from '${depth}';`);
  code = code.replace(/import axios from 'axios';/g, `import { createHttpClient, type HttpClient } from '${depth}';`);

  // Replace type
  code = code.replace(/private api: AxiosInstance;/g, 'private api: HttpClient;');
  code = code.replace(/private client: AxiosInstance;/g, 'private client: HttpClient;');

  // For singleton services (front-office, home-tools, operations, administration)
  code = code.replace(
    /private constructor\(\)\s*\{[\s\S]*?this\.api = axios\.create[\s\S]*?\n  \}/g,
    'private constructor() {\n    this.api = createHttpClient(API_BASE);\n  }'
  );

  // For domain client classes (procurement, planning, hr, finance)
  code = code.replace(
    /constructor\(\)\s*\{[\s\S]*?this\.client = axios\.create\(\{[\s\S]*?baseURL:\s*`?\${API_BASE}\/([a-zA-Z0-9_-]+)`?[\s\S]*?\n  \}/g,
    'constructor() {\n    this.client = createHttpClient(`${API_BASE}/$1`);\n  }'
  );

  // For analytics.api.ts
  code = code.replace(
    /constructor\(\)\s*\{[\s\S]*?this\.api = axios\.create[\s\S]*?\n  \}/g,
    "constructor() {\n    this.api = createHttpClient(getApiBaseUrl('/api'));\n  }"
  );

  // Any remaining axios.post
  code = code.replace(/await axios\.post\(/g, 'await createHttpClient().post(');

  fs.writeFileSync(absPath, code, 'utf8');
  console.log(`Migrated ${relPath}`);
}
