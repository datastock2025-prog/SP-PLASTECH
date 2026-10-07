import { Module } from '@nestjs/common';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { ObservabilityService } from '../../../observability/observability.service';

@Module({
  controllers: [ItemController],
  providers: [ItemService, ObservabilityService],
  exports: [ItemService],
})
export class ItemModule {}
