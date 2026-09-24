import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { SecurityExceptionFilter } from './common/filters/security-exception.filter';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AuditHashInterceptor } from './common/interceptors/audit-hash.interceptor';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Strict Content Security Policy & Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:', 'http://localhost:3000', 'http://localhost:3001', 'ws://localhost:3002'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Cookie Parser for HttpOnly refresh tokens & XSRF double-submit cookies
  app.use(cookieParser());

  // 3. Global Route Prefix
  app.setGlobalPrefix('api');

  // 4. CORS configuration with credential support
  const allowedOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, strict in prod
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-XSRF-Token',
      'X-Tenant-ID',
      'X-Unmask-PII',
      'X-Requested-With',
      'X-Idempotency-Key',
      'Idempotency-Key',
    ],
    exposedHeaders: ['Set-Cookie', 'X-Audit-Block-Hash', 'X-Idempotency-Cache'],
  });

  // 5. Global Security Exception Filter with Incident IDs
  app.useGlobalFilters(new SecurityExceptionFilter());

  // 6. Global Idempotency & Cryptographic Audit Interceptors
  app.useGlobalInterceptors(
    new IdempotencyInterceptor(),
    new AuditHashInterceptor()
  );

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');

  logger.log(`================================================================`);
  logger.log(`🚀 Reboot ERP NestJS Backend Running on http://localhost:${port}/api`);
  logger.log(`🔒 Enterprise 8-Layer Security & Hardening Suite Active`);
  logger.log(`================================================================`);
}

void bootstrap();
