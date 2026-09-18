import 'reflect-metadata';
import * as dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './security/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('ArbNexusBootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Strict Production CORS Whitelist
  const rawAllowedOrigins =
    process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = rawAllowedOrigins.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or listed origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from unapproved origin: ${origin}`);
        callback(new Error('CORS_ORIGIN_NOT_ALLOWED'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    maxAge: 86400,
  });

  // 2. HTTP Security Headers
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // 3. Global Filters & Pipes
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // 4. OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ArbNexus API — Crypto Arbitrage Intelligence')
    .setDescription(
      'ArbNexus production-grade REST & WebSocket API for real-time crypto arbitrage intelligence. Real execution is permanently disabled (ENABLE_EXECUTION=false).',
    )
    .setVersion('1.0.0')
    .addTag('Health')
    .addTag('Arbitrage Intelligence')
    .addTag('Authentication')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`ArbNexus API server running on port ${port} (Swagger docs at /api/docs)`);
}

bootstrap();
