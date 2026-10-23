/**
 * Shared Tenant Context Helper
 * Enforces Zero-LocalStorage Enterprise Architecture Rule #3 & #5.
 */

let activeTenantId = 'TENANT-ALPHA-IND';

export function getActiveTenantId(): string {
  if (typeof window !== 'undefined' && (window as any).__ERP_TENANT_ID__) {
    return (window as any).__ERP_TENANT_ID__;
  }
  return activeTenantId;
}

export function setActiveTenantId(id: string): void {
  activeTenantId = id;
  if (typeof window !== 'undefined') {
    (window as any).__ERP_TENANT_ID__ = id;
  }
}
