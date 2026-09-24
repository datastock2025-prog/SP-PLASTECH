import { Module, Global } from '@nestjs/common';
import { ObservabilityLogger } from './logger.service';
import { MetricsService } from './metrics.service';
import { TracingService } from './tracing.service';
import { AlertingService } from './alerting.service';
import { ObservabilityController } from './observability.controller';

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [
    ObservabilityLogger,
    MetricsService,
    TracingService,
    AlertingService,
  ],
  exports: [
    ObservabilityLogger,
    MetricsService,
    TracingService,
    AlertingService,
  ],
})
export class ObservabilityModule {}
