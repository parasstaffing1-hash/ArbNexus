import { BaseExchangeAdapter } from '../base/base.exchange';

export class BinanceAdapter extends BaseExchangeAdapter {
  readonly exchangeId = 'binance';
  readonly exchangeName = 'Binance';
  protected defaultMakerBps = 10; // 0.10%
  protected defaultTakerBps = 10; // 0.10% (0.075% with BNB discount)
}
