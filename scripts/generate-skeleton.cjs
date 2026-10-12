const fs = require('fs');
const path = require('path');

const moduleMap = require('../docs/module-map.json');

const rootDir = path.resolve(__dirname, '..');

const webModulesDir = path.join(rootDir, 'apps', 'web', 'src', 'modules');
const apiModulesDir = path.join(rootDir, 'apps', 'api', 'src', 'modules');
const webAppDir = path.join(rootDir, 'apps', 'web', 'src', 'app');
const webSharedDir = path.join(rootDir, 'apps', 'web', 'src', 'shared');
const apiCoreDir = path.join(rootDir, 'apps', 'api', 'src', 'core');
const packagesContractsDir = path.join(rootDir, 'packages', 'contracts');
const packagesDomainDir = path.join(rootDir, 'packages', 'domain');

// Ensure base directories
[
  webModulesDir,
  apiModulesDir,
  webAppDir,
  webSharedDir,
  apiCoreDir,
  packagesContractsDir,
  packagesDomainDir,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const modules = Object.entries(moduleMap.modules);

modules.forEach(([modName, info]) => {
  // 1. Web module structure
  const modWebDir = path.join(webModulesDir, modName);
  ['screens', 'components', 'api', 'model', '__tests__'].forEach((sub) => {
    fs.mkdirSync(path.join(modWebDir, sub), { recursive: true });
  });

  const webReadme = `# Module: ${info.name.toUpperCase()} (Web)

## Metadata
- **Owner**: ${info.owner}
- **Scope**: ${info.scope}
- **Database Schema Prefix**: \`${info.schemaPrefix}_\`
- **Tables**: ${info.tables.map((t) => `\`${t}\``).join(', ') || 'None'}

## Dependencies
- **May Import**: ${info.mayImport.map((m) => `\`${m}\``).join(', ') || 'None (Core only)'}

## Domain Events
- **Publishes**: ${info.events.publishes.map((e) => `\`${e}\``).join(', ') || 'None'}
- **Consumes**: ${info.events.consumes.map((e) => `\`${e}\``).join(', ') || 'None'}

## Public API Checklist (\`index.ts\`)
Only exports required by other allowed modules or the composition root (\`app/\`) are exposed here.
`;
  fs.writeFileSync(path.join(modWebDir, 'README.md'), webReadme, 'utf8');

  // 2. API module structure
  const modApiDir = path.join(apiModulesDir, modName);
  fs.mkdirSync(modApiDir, { recursive: true });

  const apiReadme = `# Module: ${info.name.toUpperCase()} (API)

## Metadata
- **Owner**: ${info.owner}
- **Scope**: ${info.scope}
- **Database Schema Prefix**: \`${info.schemaPrefix}_\`
- **Tables**: ${info.tables.map((t) => `\`${t}\``).join(', ') || 'None'}

## Interfaces & Ports (\`ports.ts\`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (\`events.ts\`)
- **Publishes**: ${info.events.publishes.map((e) => `\`${e}\``).join(', ') || 'None'}
- **Consumes**: ${info.events.consumes.map((e) => `\`${e}\``).join(', ') || 'None'}
`;
  fs.writeFileSync(path.join(modApiDir, 'README.md'), apiReadme, 'utf8');

  // 3. packages/contracts/<module>.ts
  const contractFile = path.join(packagesContractsDir, `${modName}.ts`);
  if (!fs.existsSync(contractFile)) {
    fs.writeFileSync(
      contractFile,
      `// Contracts & DTOs for ${modName}\nexport const MODULE_NAME = '${modName}';\n`,
      'utf8'
    );
  }

  // 4. packages/domain/<module>/README.md
  const domainDir = path.join(packagesDomainDir, modName);
  fs.mkdirSync(domainDir, { recursive: true });
  const domainReadme = `# Domain: ${modName}\n\nPure business rules for ${modName}. Golden tests in __tests__/.\n`;
  fs.writeFileSync(path.join(domainDir, 'README.md'), domainReadme, 'utf8');
});

console.log('Successfully generated modular monolith skeleton for 16 modules + core!');
