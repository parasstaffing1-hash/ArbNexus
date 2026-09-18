import { InstrumentMetadata, MarketType } from './types';

export class MarketCatalog {
  private instruments: Map<string, InstrumentMetadata> = new Map();

  public register(metadata: InstrumentMetadata): void {
    const key = this.getKey(metadata.exchange, metadata.symbol, metadata.market_type);
    this.instruments.set(key, metadata);
  }

  public get(
    exchange: string,
    symbol: string,
    marketType: MarketType = 'SPOT',
  ): InstrumentMetadata | undefined {
    return this.instruments.get(this.getKey(exchange, symbol, marketType));
  }

  public getAll(): InstrumentMetadata[] {
    return Array.from(this.instruments.values());
  }

  public getByExchange(exchange: string): InstrumentMetadata[] {
    return this.getAll().filter((i) => i.exchange.toLowerCase() === exchange.toLowerCase());
  }

  public getBySymbol(symbol: string): InstrumentMetadata[] {
    return this.getAll().filter((i) => i.symbol === symbol);
  }

  private getKey(exchange: string, symbol: string, marketType: MarketType): string {
    return `${exchange.toLowerCase()}:${symbol.toUpperCase()}:${marketType}`;
  }
}

export const GlobalMarketCatalog = new MarketCatalog();

// Seed initial prominent liquid markets for all 8 exchanges
const EXCHANGES = ['binance', 'bybit', 'okx', 'bitget', 'kucoin', 'gate', 'mexc', 'hyperliquid'];
const PAIRS = [
  {
    symbol: 'BTC/USDT',
    base: 'BTC',
    quote: 'USDT',
    tick: '0.10',
    step: '0.0001',
    minNotional: '10.0',
  },
  {
    symbol: 'ETH/USDT',
    base: 'ETH',
    quote: 'USDT',
    tick: '0.01',
    step: '0.001',
    minNotional: '10.0',
  },
  {
    symbol: 'SOL/USDT',
    base: 'SOL',
    quote: 'USDT',
    tick: '0.01',
    step: '0.01',
    minNotional: '10.0',
  },
];

for (const ex of EXCHANGES) {
  for (const pair of PAIRS) {
    // Spot
    GlobalMarketCatalog.register({
      exchange: ex,
      symbol: pair.symbol,
      market_type: 'SPOT',
      base_asset: pair.base,
      quote_asset: pair.quote,
      contract_size: '1.0',
      tick_size: pair.tick,
      quantity_step: pair.step,
      minimum_quantity: pair.step,
      minimum_notional: pair.minNotional,
      maker_fee: ex === 'hyperliquid' ? '0.0001' : '0.0010', // 1 bps on HL, 10 bps standard
      taker_fee: ex === 'hyperliquid' ? '0.00035' : '0.0020',
      settlement_asset: pair.quote,
      margin_asset: pair.quote,
      status: 'TRADING',
    });

    // Perpetual
    GlobalMarketCatalog.register({
      exchange: ex,
      symbol: pair.symbol,
      market_type: 'PERPETUAL',
      base_asset: pair.base,
      quote_asset: pair.quote,
      contract_size: '1.0',
      tick_size: pair.tick,
      quantity_step: pair.step,
      minimum_quantity: pair.step,
      minimum_notional: pair.minNotional,
      maker_fee: ex === 'hyperliquid' ? '0.0001' : '0.0002', // perps 2 bps maker
      taker_fee: ex === 'hyperliquid' ? '0.00035' : '0.0005', // perps 5 bps taker
      settlement_asset: pair.quote,
      margin_asset: pair.quote,
      status: 'TRADING',
    });
  }
}
