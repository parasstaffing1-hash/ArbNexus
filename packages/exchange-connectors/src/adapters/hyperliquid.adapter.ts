import { BaseExchangeAdapter } from '../base/base.exchange';

export class HyperliquidAdapter extends BaseExchangeAdapter {
  readonly exchangeId = 'hyperliquid';
  readonly exchangeName = 'Hyperliquid';
  protected defaultMakerBps = 0; // 0% maker or rebate
  protected defaultTakerBps = 3.5; // 0.035% ultra-low taker fee
}
