import { BaseExchangeAdapter } from '../base/base.exchange';

export class BybitAdapter extends BaseExchangeAdapter {
  readonly exchangeId = 'bybit';
  readonly exchangeName = 'Bybit';
  protected defaultMakerBps = 10;
  protected defaultTakerBps = 20;
}
