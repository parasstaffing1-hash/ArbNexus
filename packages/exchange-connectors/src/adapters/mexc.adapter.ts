import { BaseExchangeAdapter } from '../base/base.exchange';

export class MEXCAdapter extends BaseExchangeAdapter {
  readonly exchangeId = 'mexc';
  readonly exchangeName = 'MEXC';
  protected defaultMakerBps = 0; // 0% maker promo
  protected defaultTakerBps = 10;
}
