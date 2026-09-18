import { BaseExchangeAdapter } from '../base/base.exchange';

export class GateAdapter extends BaseExchangeAdapter {
  readonly exchangeId = 'gate';
  readonly exchangeName = 'Gate.io';
  protected defaultMakerBps = 15;
  protected defaultTakerBps = 20;
}
