import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ValkeyService implements OnModuleDestroy {
  private readonly logger = new Logger(ValkeyService.name);
  private client: Redis | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // don't hang if offline during build
      });

      this.client.on('error', (err) => {
        this.logger.debug(`Valkey connection pending: ${err.message}`);
      });
    } catch (e: any) {
      this.logger.warn(`Valkey initialization skipped: ${e.message}`);
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
