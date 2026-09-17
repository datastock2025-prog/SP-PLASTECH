import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  async getRoles() {
    const roles = await this.rbacService.getRoles();
    return {
      success: true,
      roles,
    };
  }

  @Get('roles/:roleId/permissions')
  async getRolePermissions(@Param('roleId') roleId: string) {
    const permissions = await this.rbacService.getRolePermissions(roleId);
    return {
      success: true,
      roleId,
      permissions,
    };
  }

  @Get('tenants')
  async getTenants() {
    const tenants = await this.rbacService.getTenants();
    return {
      success: true,
      tenants,
    };
  }
}
