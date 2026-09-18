import { BaseExchangeAdapter } from '../base/base.exchange';

export class KuCoinAdapter extends BaseExchangeAdapter {
  readonly exchangeId = 'kucoin';
  readonly exchangeName = 'KuCoin';
  protected defaultMakerBps = 10;
  protected defaultTakerBps = 10;
}
