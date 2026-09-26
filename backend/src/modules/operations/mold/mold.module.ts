import { Module } from '@nestjs/common';
import { MoldService } from './mold.service';

@Module({
  providers: [MoldService],
  exports: [MoldService],
})
export class MoldModule {}
