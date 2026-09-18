import { createConfig, getRoutes, getQuote, RoutesRequest } from '@lifi/sdk';

export interface LiFiConnectorConfig {
  integrator: string;
  apiKey?: string;
}

export type LiFiQuoteParams = Parameters<typeof getQuote>[0];

export class LiFiConnector {
  constructor(config: LiFiConnectorConfig) {
    createConfig({
      integrator: config.integrator,
      apiKey: config.apiKey,
    });
  }

  public async fetchBestRoute(request: RoutesRequest) {
    return getRoutes(request);
  }

  public async fetchQuote(request: LiFiQuoteParams) {
    return getQuote(request);
  }
}
