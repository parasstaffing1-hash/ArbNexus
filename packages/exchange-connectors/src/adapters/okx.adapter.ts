import { BaseExchangeAdapter } from '../base/base.exchange';

export class OKXAdapter extends BaseExchangeAdapter {
  readonly exchangeId = 'okx';
  readonly exchangeName = 'OKX';
  protected defaultMakerBps = 8;
  protected defaultTakerBps = 15;
}
