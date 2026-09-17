import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantBoundaryGuard } from '../../common/guards/tenant-boundary.guard';
import { RolesPermissionsGuard } from '../../common/guards/roles-permissions.guard';
import {
  RequirePermissions,
  RequireMfaStepUp,
  CurrentTenant,
  CurrentUser,
} from '../../common/decorators/auth.decorators';
import { SensitiveDataMaskingInterceptor } from '../../common/interceptors/sensitive-data.interceptor';

@UseGuards(JwtAuthGuard, TenantBoundaryGuard, RolesPermissionsGuard)
@UseInterceptors(SensitiveDataMaskingInterceptor)
@Controller()
export class BusinessController {
  // 1. Manufacturing (MES) Endpoints
  @RequirePermissions('mfg.view')
  @Get('mfg/work-orders')
  async getWorkOrders(@CurrentTenant() tenantId: string) {
    return {
      success: true,
      tenantId,
      workOrders: [
        { id: 'WO-2026-0412', itemCode: 'GRILLE-CHROME-01', targetQty: 1500, status: 'IN_PROGRESS', machineId: 'IMM-04' },
        { id: 'WO-2026-0415', itemCode: 'BRACKET-PP-09', targetQty: 4200, status: 'SCHEDULED', machineId: 'IMM-02' },
      ],
    };
  }

  // 2. Finance Endpoints (with PII Masking)
  @RequirePermissions('finance.view')
  @Get('finance/ledger')
  async getLedger(@CurrentTenant() tenantId: string) {
    return {
      success: true,
      tenantId,
      ledgerEntries: [
        { jeId: 'JE-2026-0091', account: '1010-CASH', debit: 450000, credit: 0, bankAccount: '9982348192834901' },
        { jeId: 'JE-2026-0092', account: '2010-ACCOUNTS-PAYABLE', debit: 0, credit: 450000, bankAccount: '1102938475849202' },
      ],
    };
  }

  // 3. High-Risk Sensitive Action (Requires Step-Up MFA)
  @RequirePermissions('finance.approve')
  @RequireMfaStepUp()
  @Post('finance/payments/bulk-disburse')
  async bulkDisburse(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body('batchTotal') batchTotal: number
  ) {
    return {
      success: true,
      tenantId,
      disbursedBy: user.email,
      batchTotal: batchTotal || 1250000,
      authorizationCode: 'DISB-AUTH-SUCCESS-MFA-VERIFIED',
      message: 'Payment batch successfully released to banking gateway.',
    };
  }

  // 4. Quality Endpoints
  @RequirePermissions('quality.view')
  @Get('quality/ncrs')
  async getNcrs(@CurrentTenant() tenantId: string) {
    return {
      success: true,
      tenantId,
      ncrs: [
        { id: 'NCR-2026-0041', partName: 'Bumper Grille v2.1', defect: 'Sink Mark on Cavity 2', status: 'QUARANTINED', severity: 'CRITICAL' },
      ],
    };
  }

  // 5. HR Workforce (PII Masking applied)
  @RequirePermissions('payroll.view')
  @Get('hr/payroll-summary')
  async getPayroll(@CurrentTenant() tenantId: string) {
    return {
      success: true,
      tenantId,
      employees: [
        { id: 'EMP-1001', name: 'Dr. Evelyn Reed', ssn: '984-21-9921', pan: 'ABCDE1234F', salary: '250000' },
        { id: 'EMP-1002', name: 'Rajesh Kumar', ssn: '812-44-1294', pan: 'XYZPK9821L', salary: '65000' },
      ],
    };
  }
}
