import { SDK } from '@1inch/cross-chain-sdk';

export type OneInchQuoteParams = Parameters<SDK['getQuote']>[0];

export class OneInchConnector {
  private sdk: SDK;

  constructor(apiKey: string) {
    this.sdk = new SDK({
      url: 'https://api.1inch.dev/fusion-plus',
      authKey: apiKey,
    });
  }

  public getSdk(): SDK {
    return this.sdk;
  }

  public async getCrossChainQuote(params: OneInchQuoteParams) {
    return this.sdk.getQuote(params);
  }
}
