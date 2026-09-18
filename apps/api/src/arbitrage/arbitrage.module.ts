import { Module } from '@nestjs/common';
import { ArbitrageController } from './arbitrage.controller';
import { ArbitrageService } from './arbitrage.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [ArbitrageController],
  providers: [ArbitrageService],
  exports: [ArbitrageService],
})
export class ArbitrageModule {}
