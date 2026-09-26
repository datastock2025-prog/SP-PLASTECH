import { Module } from '@nestjs/common';
import { SustainabilityService } from './sustainability.service';

@Module({
  providers: [SustainabilityService],
  exports: [SustainabilityService],
})
export class SustainabilityModule {}
