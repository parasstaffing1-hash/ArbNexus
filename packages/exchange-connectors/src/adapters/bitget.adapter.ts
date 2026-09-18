import { BaseExchangeAdapter } from '../base/base.exchange';

export class BitgetAdapter extends BaseExchangeAdapter {
  readonly exchangeId = 'bitget';
  readonly exchangeName = 'Bitget';
  protected defaultMakerBps = 10;
  protected defaultTakerBps = 20;
}
