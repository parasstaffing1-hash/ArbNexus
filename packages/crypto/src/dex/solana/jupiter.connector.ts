import { createJupiterApiClient, QuoteGetRequest, SwapRequest } from '@jup-ag/api';

export type JupiterApiClient = ReturnType<typeof createJupiterApiClient>;

export class JupiterConnector {
  private jupiterApi: JupiterApiClient;

  constructor(basePath?: string) {
    this.jupiterApi = createJupiterApiClient({ basePath });
  }

  public getClient(): JupiterApiClient {
    return this.jupiterApi;
  }

  public async getQuote(params: QuoteGetRequest) {
    return this.jupiterApi.quoteGet(params);
  }

  public async getSwapTransaction(params: SwapRequest) {
    return this.jupiterApi.swapPost({ swapRequest: params });
  }
}
