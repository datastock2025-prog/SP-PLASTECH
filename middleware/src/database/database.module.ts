import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseSeedService } from './seed';

@Global()
@Module({
  providers: [DatabaseService, DatabaseSeedService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
