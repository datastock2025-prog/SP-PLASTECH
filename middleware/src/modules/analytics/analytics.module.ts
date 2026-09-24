import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RagService } from './rag/rag.service';
import { DatabaseModule } from '../../database/database.module';
import { ObservabilityModule } from '../../common/observability/observability.module';

@Module({
  imports: [DatabaseModule, ObservabilityModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RagService],
  exports: [AnalyticsService, RagService],
})
export class AnalyticsModule {}
