import { Global, Module } from '@nestjs/common';
import { ArbitrageQueueService } from './arbitrage.queue';

@Global()
@Module({
  providers: [ArbitrageQueueService],
  exports: [ArbitrageQueueService],
})
export class QueueModule {}
