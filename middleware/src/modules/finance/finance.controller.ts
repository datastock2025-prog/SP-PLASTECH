import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  PostJournalEntryDto,
  CreateVendorInvoiceDto,
  ProcessDisbursementDto,
} from './finance.dto';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('journal-entries')
  async postJournalEntry(@Body() dto: PostJournalEntryDto) {
    return this.financeService.postJournalEntry(dto);
  }

  @Get('journal-entries')
  async getJournalEntries(@Query('tenantId') tenantId?: string) {
    return this.financeService.getJournalEntries(tenantId || 'TENANT-ALPHA-IND');
  }

  @Post('invoices/vendor')
  async createVendorInvoice(@Body() dto: CreateVendorInvoiceDto) {
    return this.financeService.createVendorInvoice(dto);
  }

  @Get('invoices/vendor')
  async getVendorInvoices(@Query('tenantId') tenantId?: string) {
    return this.financeService.getVendorInvoices(tenantId || 'TENANT-ALPHA-IND');
  }

  @Get('ap-aging')
  async getApAging(@Query('tenantId') tenantId?: string) {
    return this.financeService.getApAgingAnalysis(tenantId || 'TENANT-ALPHA-IND');
  }

  @Post('disbursements')
  async processDisbursement(@Body() dto: ProcessDisbursementDto) {
    return this.financeService.processDisbursement(dto);
  }

  @Get('trial-balance')
  async getTrialBalance(@Query('tenantId') tenantId?: string) {
    return this.financeService.getTrialBalance(tenantId || 'TENANT-ALPHA-IND');
  }
}
