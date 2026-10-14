import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';

export interface TenantInfo {
  tenantId: string;
  tenantName: string;
  name?: string;
  id?: string;
  region: string;
  complianceTier: 'SOC2_TYPE2' | 'HIPAA' | 'GDPR_ENTERPRISE';
  features: string[];
}

interface TenantContextType {
  currentTenant: TenantInfo;
  availableTenants: TenantInfo[];
  switchTenant: (tenantId: string) => void;
  validateTenantAccess: (targetTenantId: string) => boolean;
}

const AVAILABLE_TENANTS: TenantInfo[] = [
  {
    tenantId: 'TENANT-ALPHA-IND',
    tenantName: 'SP-PLASTECH Polymer Solutions Ltd. (Pune Plant)',
    name: 'SP-PLASTECH Polymer Solutions Ltd. (Pune Plant)',
    id: 'TENANT-ALPHA-IND',
    region: 'ap-south-1 (Mumbai)',
    complianceTier: 'GDPR_ENTERPRISE',
    features: ['SCM_ADVANCED', 'SPC_REALTIME', 'STOCK_TRANSFER_GST', 'AI_MRP'],
  },
  {
    tenantId: 'TENANT-BETA-US',
    tenantName: 'SP-PLASTECH Precision Tooling Inc. (Chicago Hub)',
    name: 'SP-PLASTECH Precision Tooling Inc. (Chicago Hub)',
    id: 'TENANT-BETA-US',
    region: 'us-east-1 (N. Virginia)',
    complianceTier: 'SOC2_TYPE2',
    features: ['ASSET_MOLD_TRACKER', 'ADVANCED_FINANCE'],
  },
];

const TenantContext = createContext<TenantContextType | null>(null);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeTenantId, setActiveTenantId] = useState<string>(
    user?.tenantId || AVAILABLE_TENANTS[0].tenantId
  );

  const currentTenant = useMemo(() => {
    return AVAILABLE_TENANTS.find((t) => t.tenantId === activeTenantId) || AVAILABLE_TENANTS[0];
  }, [activeTenantId]);

  const validateTenantAccess = (targetTenantId: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.tenantId === targetTenantId;
  };

  const switchTenant = (tenantId: string) => {
    if (!validateTenantAccess(tenantId)) {
      throw new Error(`Security Violation: Unauthorized tenant access attempt for ${tenantId}`);
    }
    setActiveTenantId(tenantId);
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        availableTenants: AVAILABLE_TENANTS,
        switchTenant,
        validateTenantAccess,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider');
  return ctx;
};
