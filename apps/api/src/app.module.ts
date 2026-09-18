import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { ValkeyModule } from './valkey/valkey.module';
import { QueueModule } from './queues/queue.module';
import { GatewayModule } from './gateway/gateway.module';
import { HealthModule } from './health/health.module';
import { ArbitrageModule } from './arbitrage/arbitrage.module';
import { AuthModule } from './auth/auth.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { throttlerConfig } from './config/throttler.config';
import { CredentialStore } from './security/secrets.provider';
import { ExecutionSafetyGuard } from './security/execution-safety.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot(throttlerConfig),
    PrismaModule,
    ValkeyModule,
    QueueModule,
    GatewayModule,
    HealthModule,
    ArbitrageModule,
    AuthModule,
  ],
  providers: [
    CredentialStore,
    // Activate global rate-limiting across all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Enforce server-side execution disability on execution endpoints
    {
      provide: APP_GUARD,
      useClass: ExecutionSafetyGuard,
    },
  ],
  exports: [CredentialStore],
})
export class AppModule {}
