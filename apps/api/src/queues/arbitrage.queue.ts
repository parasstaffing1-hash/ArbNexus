import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class ArbitrageQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(ArbitrageQueueService.name);
  public opportunityQueue: Queue | null = null;
  public executionQueue: Queue | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    const connection = {
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    };

    try {
      this.opportunityQueue = new Queue('arbitrage-opportunities', { connection });
      this.executionQueue = new Queue('arbitrage-executions', { connection });
      this.logger.log('Arbitrage BullMQ Queues initialized');
    } catch (e: any) {
      this.logger.warn(`BullMQ queue initialization deferred: ${e.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.opportunityQueue) await this.opportunityQueue.close().catch(() => {});
    if (this.executionQueue) await this.executionQueue.close().catch(() => {});
  }
}
