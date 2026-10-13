const fs = require('fs');
const path = require('path');

function findFile(baseName) {
  function search(dir) {
    for (const f of fs.readdirSync(dir)) {
      if (f === 'node_modules' || f === 'dist' || f === '.git') continue;
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const found = search(full);
        if (found) return found;
      } else if (f.startsWith(baseName)) {
        return full;
      }
    }
    return null;
  }
  return search(path.resolve('src'));
}

const names = [
  'aiDocumentExporter',
  'AuthProvider',
  'LocationAutocompleteInput',
  'jitCalculations',
  'BomVersionRecipeDeveloperModal',
  'BomVersionApprovalGrid',
  'SecurityEventLogger',
  'secureExport',
  'GdprService',
  'PasswordPolicy',
  'SessionManager',
  'TenantContext',
  'sidebarNavigationData',
  'workspaceRbac'
];

for (const name of names) {
  const loc = findFile(name);
  console.log(name, '->', loc ? path.relative('.', loc) : 'NOT FOUND');
}
