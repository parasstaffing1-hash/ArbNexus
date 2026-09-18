import { Novu } from '@novu/node';

export interface NovuArbitragePayload {
  opportunityId: string;
  pair: string;
  spreadPercent: number;
  netProfitUsd: number;
  sourceExchange: string;
  targetExchange: string;
}

export class NovuNotificationService {
  private novu: Novu | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.novu = new Novu(apiKey);
    }
  }

  public async sendArbitrageAlert(
    subscriberId: string,
    payload: NovuArbitragePayload,
  ): Promise<boolean> {
    if (!this.novu) return false;
    try {
      await this.novu.trigger('arbitrage-opportunity-alert', {
        to: { subscriberId },
        payload: {
          opportunityId: payload.opportunityId,
          pair: payload.pair,
          spread: `${payload.spreadPercent.toFixed(2)}%`,
          profit: `$${payload.netProfitUsd.toFixed(2)}`,
          source: payload.sourceExchange,
          target: payload.targetExchange,
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
