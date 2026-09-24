import { Module } from '@nestjs/common';
import { FrontOfficeController } from './front-office.controller';
import { FrontOfficeService } from './front-office.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FrontOfficeController],
  providers: [FrontOfficeService],
  exports: [FrontOfficeService],
})
export class FrontOfficeModule {}
