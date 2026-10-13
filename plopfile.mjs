import fs from 'node:fs';
import path from 'node:path';

export default function (plop) {
  const getTimestamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  };

  plop.setHelper('timestamp', () => getTimestamp());

  // 1. MODULE GENERATOR
  plop.setGenerator('module', {
    description: 'Scaffold a complete enterprise ERP module across all layers',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Module name (lowercase, e.g. demo, fleet):',
        validate: (v) => (/^[a-z0-9_-]+$/.test(v) ? true : 'Use lowercase letters, numbers, hyphens/underscores only'),
      },
      {
        type: 'input',
        name: 'subject',
        message: 'CASL Subject name (PascalCase, e.g. Demo, Fleet):',
        default: (answers) => answers.name ? answers.name.charAt(0).toUpperCase() + answers.name.slice(1) : '',
      },
      {
        type: 'input',
        name: 'owner',
        message: 'Team owner (e.g. platform-team, manufacturing-team):',
        default: 'platform-team',
      },
    ],
    actions: (data) => {
      const ts = getTimestamp();
      data.timestamp = ts;
      data.owner = data.owner || 'platform-team';

      return [
        // 1. Contracts
        {
          type: 'add',
          path: 'packages/contracts/{{name}}.ts',
          templateFile: 'generators/templates/contracts.ts.hbs',
          abortOnFail: true,
        },
        // 2. Migration
        {
          type: 'add',
          path: `db/migrations/${ts}_{{name}}.sql`,
          templateFile: 'generators/templates/migration.sql.hbs',
          abortOnFail: true,
        },
        // 3. API Module Slice
        {
          type: 'add',
          path: 'apps/api/src/modules/{{name}}/router.ts',
          templateFile: 'generators/templates/api/router.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/api/src/modules/{{name}}/service.ts',
          templateFile: 'generators/templates/api/service.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/api/src/modules/{{name}}/repo.ts',
          templateFile: 'generators/templates/api/repo.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/api/src/modules/{{name}}/ports.ts',
          templateFile: 'generators/templates/api/ports.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/api/src/modules/{{name}}/events.ts',
          templateFile: 'generators/templates/api/events.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/api/src/modules/{{name}}/index.ts',
          templateFile: 'generators/templates/api/index.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/api/src/modules/{{name}}/README.md',
          templateFile: 'generators/templates/api/README.md.hbs',
          abortOnFail: true,
        },
        // 4. Pure Domain Logic & Golden Tests
        {
          type: 'add',
          path: 'packages/domain/{{name}}.ts',
          templateFile: 'generators/templates/domain/logic.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'tests/golden/{{name}}.test.ts',
          templateFile: 'generators/templates/domain/golden.test.ts.hbs',
          abortOnFail: true,
        },
        // 5. Web UI Slice
        {
          type: 'add',
          path: 'apps/web/src/modules/{{name}}/index.ts',
          templateFile: 'generators/templates/web/index.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/web/src/modules/{{name}}/routes.tsx',
          templateFile: 'generators/templates/web/routes.tsx.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/web/src/modules/{{name}}/api/{{name}}Api.ts',
          templateFile: 'generators/templates/web/api.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/web/src/modules/{{name}}/model/types.ts',
          templateFile: 'generators/templates/web/types.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/web/src/modules/{{name}}/components/{{pascalCase name}}Form.tsx',
          templateFile: 'generators/templates/web/Form.tsx.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/web/src/modules/{{name}}/screens/{{pascalCase name}}ListView.tsx',
          templateFile: 'generators/templates/web/ListView.tsx.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/web/src/modules/{{name}}/__tests__/{{name}}.spec.ts',
          templateFile: 'generators/templates/web/spec.ts.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/web/src/modules/{{name}}/README.md',
          templateFile: 'generators/templates/web/README.md.hbs',
          abortOnFail: true,
        },
        // 6. E2E Tests
        {
          type: 'add',
          path: 'e2e/{{name}}/{{name}}.spec.ts',
          templateFile: 'generators/templates/e2e.spec.ts.hbs',
          abortOnFail: true,
        },
        // 7. Docs
        {
          type: 'add',
          path: 'docs/modules/{{name}}.md',
          templateFile: 'generators/templates/docs.md.hbs',
          abortOnFail: true,
        },
        // 8. Register in docs/module-map.json
        function registerInModuleMap(answers) {
          const mapPath = path.resolve('docs/module-map.json');
          if (fs.existsSync(mapPath)) {
            const raw = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
            if (raw.modules && !raw.modules[answers.name]) {
              raw.modules[answers.name] = {
                name: answers.name,
                owner: answers.owner || 'platform-team',
                scope: `${answers.name} domain operations and management`,
                schemaPrefix: answers.name.slice(0, 3).toLowerCase(),
                tables: [answers.name],
                mayImport: ['core'],
                events: {
                  publishes: [`${answers.subject}Created`, `${answers.subject}Updated`],
                  consumes: [],
                },
              };
              fs.writeFileSync(mapPath, JSON.stringify(raw, null, 2) + '\n', 'utf8');
              return `Updated docs/module-map.json with ${answers.name}`;
            }
          }
          return 'Skipped docs/module-map.json update';
        },
      ];
    },
  });

  // 2. RESOURCE GENERATOR (child table)
  plop.setGenerator('resource', {
    description: 'Add a child resource / table to an existing module',
    prompts: [
      {
        type: 'input',
        name: 'module',
        message: 'Parent module name (e.g. engineering, demo):',
        validate: (v) => (/^[a-z0-9_-]+$/.test(v) ? true : 'Module name required'),
      },
      {
        type: 'input',
        name: 'name',
        message: 'Child resource name (e.g. item, line, log):',
        validate: (v) => (/^[a-z0-9_-]+$/.test(v) ? true : 'Resource name required'),
      },
    ],
    actions: (data) => {
      const ts = getTimestamp();
      data.timestamp = ts;

      return [
        {
          type: 'add',
          path: `db/migrations/${ts}_{{module}}_{{name}}.sql`,
          templateFile: 'generators/templates/resource/migration.sql.hbs',
          abortOnFail: true,
        },
        {
          type: 'add',
          path: 'apps/api/src/modules/{{module}}/{{name}}Router.ts',
          templateFile: 'generators/templates/resource/router.ts.hbs',
          abortOnFail: true,
        },
      ];
    },
  });
}
