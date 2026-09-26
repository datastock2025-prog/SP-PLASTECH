import { Module } from '@nestjs/common';
import { SpcService } from './spc.service';

@Module({
  providers: [SpcService],
  exports: [SpcService],
})
export class SpcModule {}
