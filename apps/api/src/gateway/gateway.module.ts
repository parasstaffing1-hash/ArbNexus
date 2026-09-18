import { Module } from '@nestjs/common';
import { ArbitrageGateway } from './arbitrage.gateway';

@Module({
  providers: [ArbitrageGateway],
  exports: [ArbitrageGateway],
})
export class GatewayModule {}
