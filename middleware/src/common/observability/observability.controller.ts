import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { AlertingService } from './alerting.service';
import { ObservabilityLogger } from './logger.service';

@Controller('observability')
export class ObservabilityController {
  constructor(
    private readonly metrics: MetricsService,
    private readonly alerting: AlertingService,
    private readonly logger: ObservabilityLogger
  ) {}

  @Get('metrics')
  async getMetrics() {
    const data = await this.metrics.getMetrics();
    return {
      success: true,
      data,
      contentType: this.metrics.getContentType(),
    };
  }

  @Get('alerts')
  getAlerts() {
    return {
      success: true,
      rules: this.alerting.getRules(),
      history: this.alerting.getAlertHistory(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      success: true,
      data: {
        status: 'HEALTHY_LIVE',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };
  }
}
