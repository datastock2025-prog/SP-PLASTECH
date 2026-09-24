import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
