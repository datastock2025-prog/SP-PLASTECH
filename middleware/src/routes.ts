import type { Auth } from './auth.js';
import { requireSession, enforcePasswordChange, errorHandler } from './middleware.js';
import { createRouter } from './router.js';

import { identityRoutes } from './modules/identity/routes.js';
import { orgRoutes } from './modules/org/routes.js';
import { approvalsRoutes } from './modules/approvals/routes.js';
import { platformRoutes } from './modules/platform/routes.js';
import { integrationsRoutes } from './modules/integrations/routes.js';
import { masterdataRoutes } from './modules/masterdata/routes.js';
import { procurementRoutes } from './modules/procurement/routes.js';
import { salesRoutes } from './modules/sales/routes.js';
import { warehouseRoutes } from './modules/warehouse/routes.js';
import { manufacturingRoutes } from './modules/manufacturing/routes.js';
import { engineeringRoutes } from './modules/engineering/routes.js';
import { qualityRoutes } from './modules/quality/routes.js';
import { financeRoutes } from './modules/finance/routes.js';
import { hrRoutes } from './modules/hr/routes.js';
import { maintenanceRoutes } from './modules/maintenance/routes.js';
import { crmRoutes } from './modules/crm/routes.js';
import { planningRoutes } from './modules/planning/routes.js';
import { analyticsRoutes } from './modules/analytics/routes.js';
import { workspaceRoutes } from './modules/workspace/routes.js';

export function buildRouter(auth: Auth) {
  const r = createRouter(errorHandler);
  r.use(requireSession(auth), enforcePasswordChange);

  identityRoutes(r, auth);
  orgRoutes(r);
  approvalsRoutes(r);
  platformRoutes(r);
  integrationsRoutes(r);
  masterdataRoutes(r);
  procurementRoutes(r);
  salesRoutes(r);
  warehouseRoutes(r);
  manufacturingRoutes(r);
  engineeringRoutes(r);
  qualityRoutes(r);
  financeRoutes(r);
  hrRoutes(r);
  maintenanceRoutes(r);
  crmRoutes(r);
  planningRoutes(r);
  analyticsRoutes(r);
  workspaceRoutes(r);

  return r.app;
}
