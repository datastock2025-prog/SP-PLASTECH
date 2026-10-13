const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results = results.concat(walk(full));
    else if (file.endsWith('.ts') || file.endsWith('.tsx')) results.push(full);
  }
  return results;
}

const files = walk(path.resolve('apps/web/src/modules'));
let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // PaginationBar & MasterDataCombobox
  content = content.replace(/(['"])(\.\.\/common\/PaginationBar)(['"])/g, '$1@/src/components/common/PaginationBar$3');
  content = content.replace(/(['"])(\.\.\/common\/MasterDataCombobox)(['"])/g, '$1@/src/components/common/MasterDataCombobox$3');

  // Security components in identity module
  if (file.includes('identity')) {
    content = content.replace(/(['"])(\.\.\/auth\/AuthProvider)(['"])/g, '$1@/src/security/auth/AuthProvider$3');
    content = content.replace(/(['"])(\.\.\/logging\/SecurityEventLogger)(['"])/g, '$1@/src/security/logging/SecurityEventLogger$3');
    content = content.replace(/(['"])(\.\.\/types)(['"])/g, '$1@/src/security/types$3');
    content = content.replace(/(['"])(\.\.\/privacy\/secureExport)(['"])/g, '$1@/src/security/privacy/secureExport$3');
    content = content.replace(/(['"])(\.\.\/compliance\/GdprService)(['"])/g, '$1@/src/security/compliance/GdprService$3');
    content = content.replace(/(['"])(\.\.\/auth\/PasswordPolicy)(['"])/g, '$1@/src/security/auth/PasswordPolicy$3');
    content = content.replace(/(['"])(\.\.\/auth\/SessionManager)(['"])/g, '$1@/src/security/auth/SessionManager$3');
    content = content.replace(/(['"])(\.\.\/rbac\/TenantContext)(['"])/g, '$1@/src/security/rbac/TenantContext$3');

    content = content.replace(/(['"])(\.\.\/\.\.\/data\/)(.*?)(['"])/g, '$1@/src/data/$3$4');
    content = content.replace(/(['"])(\.\.\/\.\.\/services\/)(.*?)(['"])/g, '$1@/src/services/$3$4');
    content = content.replace(/(['"])(\.\.\/\.\.\/hooks\/)(.*?)(['"])/g, '$1@/src/hooks/$3$4');
    content = content.replace(/(['"])(\.\.\/\.\.\/types\/)(.*?)(['"])/g, '$1@/src/types/$3$4');
    content = content.replace(/(['"])(\.\.\/\.\.\/types)(['"])/g, '$1@/src/types$3');
    content = content.replace(/(['"])(\.\.\/\.\.\/shared\/)(.*?)(['"])/g, '$1@/src/shared/$3$4');
    content = content.replace(/(['"])(\.\.\/\.\.\/features\/)(.*?)(['"])/g, '$1@/src/features/$3$4');
  }

  // Analytics components
  content = content.replace(/(['"])(\.\.\/\.\.\/utils\/aiDocumentExporter)(['"])/g, '$1@/src/utils/aiDocumentExporter$3');

  // Masterdata
  content = content.replace(/(['"])(\.\.\/\.\.\/\.\.\/types)(['"])/g, '$1@/src/types$3');
  content = content.replace(/(['"])(\.\.\/\.\.\/\.\.\/services\/itemService)(['"])/g, '$1@/src/services/itemService$3');
  content = content.replace(/(['"])(\.\.\/\.\.\/\.\.\/lib\/api-client)(['"])/g, '$1@/src/lib/api-client$3');
  content = content.replace(/(['"])(\.\.\/types\/masterDataSchemas)(['"])/g, '$1../model/masterDataSchemas$3');
  content = content.replace(/(['"])(\.\.\/data\/initialData)(['"])/g, '$1@/src/data/initialData$3');
  content = content.replace(/(['"])(\.\.\/hooks\/useWarehouse)(['"])/g, '$1@/src/hooks/useWarehouse$3');

  // Procurement
  content = content.replace(/(['"])(\.\.\/masterdata\/CreateItemWizardModal)(['"])/g, '$1@/apps/web/src/modules/masterdata/components/CreateItemWizardModal$3');

  // Warehouse cross-module components
  content = content.replace(/(['"])(\.\.\/engineering\/bomWizard\/LocationAutocompleteInput)(['"])/g, '$1@/src/components/engineering/bomWizard/LocationAutocompleteInput$3');
  content = content.replace(/(['"])(\.\.\/manufacturing\/jit\/jitCalculations)(['"])/g, '$1@/src/components/manufacturing/jit/jitCalculations$3');
  content = content.replace(/(['"])(\.\.\/manufacturing\/bom\/BomVersionRecipeDeveloperModal)(['"])/g, '$1@/src/components/manufacturing/bom/BomVersionRecipeDeveloperModal$3');
  content = content.replace(/(['"])(\.\.\/manufacturing\/bom\/BomVersionApprovalGrid)(['"])/g, '$1@/src/components/manufacturing/bom/BomVersionApprovalGrid$3');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
}

console.log('Modified files:', modifiedCount);
