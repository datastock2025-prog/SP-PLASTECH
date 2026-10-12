/** @type {import('dependency-cruiser').IConfiguration} */
const moduleMap = require('./docs/module-map.json');

const moduleForbiddenRules = [];

Object.entries(moduleMap.modules).forEach(([modName, modConfig]) => {
  if (modName === 'workspace' || modName === 'core') return;
  const allowed = new Set([...(modConfig.mayImport || []), modName, 'core']);
  
  const forbiddenModules = Object.keys(moduleMap.modules).filter(
    (m) => !allowed.has(m) && m !== 'core'
  );

  if (forbiddenModules.length > 0) {
    const pattern = `^apps/(web|api)/src/modules/(${forbiddenModules.join('|')})/`;
    moduleForbiddenRules.push({
      name: `module-${modName}-may-only-import-allowed`,
      severity: 'error',
      comment: `${modName} is only allowed to import [${Array.from(allowed).join(', ')}]`,
      from: { path: `^apps/(web|api)/src/modules/${modName}/` },
      to: { path: pattern },
    });
  }
});

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are forbidden across modules',
      from: {},
      to: { circular: true },
    },
    {
      name: 'module-internals-are-private',
      severity: 'error',
      comment: 'Another module may only be imported through its index.ts',
      from: { path: '^apps/(web|api)/src/modules/([^/]+)/' },
      to: {
        path: '^apps/(web|api)/src/modules/([^/]+)/(?!index\\.ts)',
        pathNot: '^apps/(web|api)/src/modules/$2/',
      },
    },
    {
      name: 'shared-and-core-know-no-module',
      severity: 'error',
      comment: 'Shared and core layers must not depend on domain feature modules',
      from: { path: '^apps/(web|api)/src/(shared|core)/' },
      to: { path: '^apps/(web|api)/src/modules/' },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment: 'Domain packages must remain pure business logic without framework bindings',
      from: { path: '^packages/domain/' },
      to: { path: '^(apps/|node_modules/(pg|hono|kysely|react))' },
    },
    {
      name: 'web-and-api-never-import-each-other',
      severity: 'error',
      comment: 'Web and API deployables must never import each other directly',
      from: { path: '^apps/web/' },
      to: { path: '^apps/api/' },
    },
    ...moduleForbiddenRules,
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json',
    },
  },
};
