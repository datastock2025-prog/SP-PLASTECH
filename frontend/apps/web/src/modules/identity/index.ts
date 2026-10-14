// ============================================================================
// IDENTITY MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/identity/index.ts
// ============================================================================

export { AdminViews } from './screens/AdminViews';
export { LoginScreen } from './screens/LoginScreen';
export { UserProfilePreferencesView } from './screens/UserProfilePreferencesView';

export {
  useMe,
  useLogin,
  useLogout,
  useChangePassword,
  useSelectContext,
  useSelectPlantShift,
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useResetPassword,
  useRoles,
  usePlants,
  useAuditEntries,
  usePreferences,
  useUpdatePreferences,
  useUpdateMe,
} from './api/useIdentity';
export { useAdmin } from './api/useAdmin';
export { AuthProvider, useAuth } from './api/AuthProvider';

export { identityRoutes } from './routes';

export type {
  AdminUser,
  AdminRole,
  CompanyProfile,
  NumberingSequence,
  ApprovalWorkflow,
  SecurityPolicySettings,
  AuditLogEntry,
  Me,
  ManagedUser,
  Plant,
  Role,
  UserStatus,
  Preferences,
  AuditEntry,
  PageMeta,
} from './model/types';
