import { ExchangeAdapterFactory } from '@arbitrage/exchange-connectors';
import { DEXAdapterFactory } from '@arbitrage/dex-connectors';
import { DataQualityEngine } from '@arbitrage/data-quality';
import { Ticker, OrderBook, FundingRate, createEnvelope, TOPICS } from '@arbitrage/market-data';
import { EventBus } from '../bus/event-bus';

export class MarketIngestor {
  private eventBus: EventBus;
  private qualityEngine: DataQualityEngine;
  private isRunning: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.qualityEngine = new DataQualityEngine();
  }

  async pollTickers(symbols: string[] = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']): Promise<Ticker[]> {
    const adapters = ExchangeAdapterFactory.getAllAdapters();
    const tickers: Ticker[] = [];

    for (const adapter of adapters) {
      for (const symbol of symbols) {
        try {
          const ticker = await adapter.markets.fetchTicker(symbol);
          const assessment = this.qualityEngine.validateTicker(ticker);

          if (assessment.isExecutable) {
            tickers.push(ticker);

            // Publish to event bus
            const envelope = createEnvelope(adapter.exchangeId, symbol, ticker, {
              exchangeTimestamp: ticker.timestamp,
            });
            await this.eventBus.publish(TOPICS.MARKET_TICKER, envelope);
          }
        } catch (err) {
          // Graceful handling of individual venue failure
        }
      }
    }

    return tickers;
  }

  async pollFundingRates(
    symbols: string[] = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
  ): Promise<FundingRate[]> {
    const adapters = ExchangeAdapterFactory.getAllAdapters();
    const fundingRates: FundingRate[] = [];

    for (const adapter of adapters) {
      for (const symbol of symbols) {
        try {
          const rate = await adapter.funding.fetchFundingRate(symbol);
          fundingRates.push(rate);

          const envelope = createEnvelope(adapter.exchangeId, symbol, rate, {
            exchangeTimestamp: rate.timestamp,
          });
          await this.eventBus.publish(TOPICS.MARKET_FUNDING, envelope);
        } catch (err) {
          // Graceful ignore
        }
      }
    }

    return fundingRates;
  }

  async fetchOrderBookSnapshot(exchange: string, symbol: string): Promise<OrderBook | null> {
    try {
      const adapter = ExchangeAdapterFactory.getAdapter(exchange);
      const book = await adapter.orderBooks.fetchOrderBook(symbol);
      const assessment = this.qualityEngine.validateOrderBook(book);

      if (assessment.isExecutable) {
        const envelope = createEnvelope(exchange, symbol, book, {
          exchangeTimestamp: book.timestamp,
        });
        await this.eventBus.publish(TOPICS.MARKET_ORDERBOOK, envelope);
        return book;
      }
    } catch {
      return null;
    }
    return null;
  }
}
