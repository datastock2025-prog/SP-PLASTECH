import assert from 'node:assert/strict';
import { engineeringRoutes } from './engineering/routes.js';
import { financeRoutes } from './finance/routes.js';
import { hrRoutes } from './hr/routes.js';
import { maintenanceRoutes } from './maintenance/routes.js';
import { manufacturingRoutes } from './manufacturing/routes.js';
import { planningRoutes } from './planning/routes.js';
import { procurementRoutes } from './procurement/routes.js';
import { salesRoutes } from './sales/routes.js';
import { warehouseRoutes } from './warehouse/routes.js';
import { workspaceRoutes } from './workspace/routes.js';
import { platformRoutes } from './platform/routes.js';
import { analyticsRoutes } from './analytics/routes.js';
import { approvalsRoutes } from './approvals/routes.js';
import { integrationsRoutes } from './integrations/routes.js';
import { masterdataRoutes } from './masterdata/routes.js';
import { orgRoutes } from './org/routes.js';
import { identityRoutes } from './identity/routes.js';

// Boot smoke test: every migrated module registers against real Drizzle tables (resolveTable throws otherwise).
const seen: string[] = [];
const add = (m: string) => (p: string) => { seen.push(`${m} ${p}`); };
const fake = { get: add('GET'), post: add('POST'), patch: add('PATCH'), delete: add('DELETE'), put: add('PUT'), use() {} };
const fakeAuth = { api: {} };

for (const mount of [
  engineeringRoutes, financeRoutes, hrRoutes, maintenanceRoutes, manufacturingRoutes, planningRoutes,
  procurementRoutes, salesRoutes, warehouseRoutes, workspaceRoutes, platformRoutes, analyticsRoutes,
  approvalsRoutes, integrationsRoutes, masterdataRoutes, orgRoutes,
]) {
  mount(fake as any);
}
identityRoutes(fake as any, fakeAuth as any);

assert.ok(seen.includes('GET /employees') && seen.includes('PATCH /sales-orders/:id') && seen.includes('GET /stock/:id/history'));
assert.ok(seen.includes('GET /dashboard/summary') && seen.includes('GET /me') && seen.includes('GET /plants'));
console.log(`all 16 modules register: ${seen.length} routes, all tables resolve`);
