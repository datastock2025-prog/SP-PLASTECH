import { Controller, Get, Inject, Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Pool } from 'pg';

@Injectable()
class HealthService {
  private readonly pool = new Pool({ connectionString: process.env.DATABASE_URL });

  async database() {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      return { status: 'ok', database: 'reachable' };
    } finally {
      client.release();
    }
  }
}

@Controller('health')
class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  status() {
    return { status: 'ok', service: 'middleware' };
  }

  @Get('db')
  database() {
    return this.healthService.database();
  }
}

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000', credentials: true });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

void bootstrap();
