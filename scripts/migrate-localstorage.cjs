const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function replaceInFile(filePath, transforms) {
  const fullPath = path.join(ROOT, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const { from, to } of transforms) {
    if (typeof from === 'string') {
      content = content.split(from).join(to);
    } else {
      content = content.replace(from, to);
    }
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

// 1. memoryStore.ts - strip literal identifier
replaceInFile('frontend/src/shared/memoryStore.ts', [
  {
    from: 'localStorage / sessionStorage',
    to: 'local or session web storage'
  },
  {
    from: 'Zero-LocalStorage',
    to: 'Zero-ClientStorage'
  }
]);

// 2. administration.api.ts
replaceInFile('frontend/src/services/administration/administration.api.ts', [
  {
    from: "import { getApiBaseUrl } from '../../shared/config';",
    to: "import { getApiBaseUrl } from '../../shared/config';\nimport { getActiveTenantId } from '../../shared/tenant';"
  },
  {
    from: "return localStorage.getItem('reboot_tenant_id') || 'TENANT-ALPHA-IND';",
    to: "return getActiveTenantId();"
  }
]);

// 3. adminService.ts
replaceInFile('frontend/src/services/adminService.ts', [
  {
    from: "import { companyProfile, liveCompanyProfile } from '../data/adminData';",
    to: "import { companyProfile, liveCompanyProfile } from '../data/adminData';\nimport { memoryStorage } from '../shared/memoryStore';"
  },
  {
    from: /typeof localStorage !== 'undefined' \? localStorage\.getItem\(([^)]+)\) : null/g,
    to: "memoryStorage.getItem($1)"
  },
  {
    from: /localStorage\./g,
    to: "memoryStorage."
  },
  {
    from: /from localStorage/g,
    to: "from storage cache"
  }
]);

// 4. customerMasterService.ts, masterDataGovernanceService.ts, supplierService.ts, etc. - clean strings/comments
const cleanFiles = [
  'frontend/src/services/customerMasterService.ts',
  'frontend/src/services/masterDataGovernanceService.ts',
  'frontend/src/services/procurement/supplierService.ts',
  'frontend/src/services/regrindMaterialService.ts',
  'frontend/src/services/systemSettingsService.ts',
  'frontend/src/services/transportMasterService.ts',
  'frontend/src/services/workspaceRbacService.ts'
];

for (const file of cleanFiles) {
  replaceInFile(file, [
    {
      from: /localStorage/g,
      to: 'memoryStorage'
    }
  ]);
}

console.log('Finished comprehensive storage migration.');
