import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { HomeToolsController } from './home-tools.controller';
import { HomeToolsService } from './home-tools.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HomeToolsController],
  providers: [HomeToolsService],
  exports: [HomeToolsService],
})
export class HomeToolsModule {}
