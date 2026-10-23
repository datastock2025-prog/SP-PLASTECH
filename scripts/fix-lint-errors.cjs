const fs = require('fs');

// 1. workspaceRbacService.ts
const rbacFile = 'frontend/src/services/workspaceRbacService.ts';
let rbacContent = fs.readFileSync(rbacFile, 'utf8');
if (!rbacContent.includes('memoryStore')) {
  rbacContent = "import { memoryStorage } from '../shared/memoryStore';\n" + rbacContent;
  fs.writeFileSync(rbacFile, rbacContent, 'utf8');
  console.log('Fixed workspaceRbacService.ts');
}

// 2. home-tools.api.ts
const homeFile = 'frontend/src/services/home-tools/api/home-tools.api.ts';
let homeContent = fs.readFileSync(homeFile, 'utf8');
if (!homeContent.includes('getTenantId')) {
  homeContent = homeContent.replace(
    "import { getApiBaseUrl } from '../../../shared/config';",
    "import { getApiBaseUrl } from '../../../shared/config';\nimport { getActiveTenantId as getTenantId } from '../../../shared/tenant';"
  );
  homeContent = homeContent.replace(
    'return getActiveTenantId();',
    'return getTenantId();'
  );
  fs.writeFileSync(homeFile, homeContent, 'utf8');
  console.log('Fixed home-tools.api.ts');
}
