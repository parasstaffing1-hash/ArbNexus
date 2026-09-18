import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Lazy connect or graceful connect
    try {
      await this.$connect();
      console.log('[PrismaService] Connected to PostgreSQL database successfully.');
    } catch (err: any) {
      console.warn(
        `[PrismaService] Database connection deferred (${err?.message || 'initial handshake'}). Waiting for PostgreSQL instance.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
