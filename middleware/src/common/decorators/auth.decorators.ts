import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'security_roles';
export const PERMISSIONS_KEY = 'security_permissions';
export const REQUIRE_MFA_KEY = 'security_require_mfa';

export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
export const RequireMfaStepUp = () => SetMetadata(REQUIRE_MFA_KEY, true);

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});

export const CurrentTenant = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.headers['x-tenant-id'] || request.user?.tenantId || 'TENANT-ALPHA-IND';
});
