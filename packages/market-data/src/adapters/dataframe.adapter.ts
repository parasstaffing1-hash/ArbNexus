import { Trade, Ticker, FundingRate } from '../types';

export interface ColumnarBatch {
  columns: Record<string, any[]>;
  rowCount: number;
  schema: Record<string, string>;
}

export class DataFrameAdapter {
  /**
   * Converts an array of Trade records into a columnar layout for Arrow/Polars interchange.
   */
  static tradesToColumnar(trades: Trade[]): ColumnarBatch {
    const columns: Record<string, any[]> = {
      id: [],
      exchange: [],
      symbol: [],
      price: [],
      amount: [],
      cost: [],
      side: [],
      timestamp: [],
      is_maker: [],
    };

    for (const t of trades) {
      columns.id.push(t.id);
      columns.exchange.push(t.exchange);
      columns.symbol.push(t.symbol);
      columns.price.push(parseFloat(t.price));
      columns.amount.push(parseFloat(t.amount));
      columns.cost.push(parseFloat(t.cost));
      columns.side.push(t.side);
      columns.timestamp.push(t.timestamp);
      columns.is_maker.push(t.isMaker ?? false);
    }

    return {
      columns,
      rowCount: trades.length,
      schema: {
        id: 'utf8',
        exchange: 'utf8',
        symbol: 'utf8',
        price: 'float64',
        amount: 'float64',
        cost: 'float64',
        side: 'utf8',
        timestamp: 'int64',
        is_maker: 'bool',
      },
    };
  }

  /**
   * Converts an array of Tickers into a columnar layout.
   */
  static tickersToColumnar(tickers: Ticker[]): ColumnarBatch {
    const columns: Record<string, any[]> = {
      exchange: [],
      symbol: [],
      bid: [],
      bid_volume: [],
      ask: [],
      ask_volume: [],
      last: [],
      volume: [],
      timestamp: [],
    };

    for (const t of tickers) {
      columns.exchange.push(t.exchange);
      columns.symbol.push(t.symbol);
      columns.bid.push(parseFloat(t.bid));
      columns.bid_volume.push(parseFloat(t.bidVolume || t.bid_size || '0'));
      columns.ask.push(parseFloat(t.ask));
      columns.ask_volume.push(parseFloat(t.askVolume || t.ask_size || '0'));
      columns.last.push(parseFloat(t.last));
      columns.volume.push(parseFloat(t.volume));
      columns.timestamp.push(t.timestamp);
    }

    return {
      columns,
      rowCount: tickers.length,
      schema: {
        exchange: 'utf8',
        symbol: 'utf8',
        bid: 'float64',
        bid_volume: 'float64',
        ask: 'float64',
        ask_volume: 'float64',
        last: 'float64',
        volume: 'float64',
        timestamp: 'int64',
      },
    };
  }

  /**
   * Converts FundingRate records into a columnar layout.
   */
  static fundingToColumnar(funding: FundingRate[]): ColumnarBatch {
    const columns: Record<string, any[]> = {
      exchange: [],
      symbol: [],
      rate: [],
      interval_hours: [],
      next_funding_time: [],
      timestamp: [],
    };

    for (const f of funding) {
      columns.exchange.push(f.exchange);
      columns.symbol.push(f.symbol);
      columns.rate.push(parseFloat(f.rate));
      columns.interval_hours.push(f.intervalHours);
      columns.next_funding_time.push(f.nextFundingTime);
      columns.timestamp.push(f.timestamp);
    }

    return {
      columns,
      rowCount: funding.length,
      schema: {
        exchange: 'utf8',
        symbol: 'utf8',
        rate: 'float64',
        interval_hours: 'int32',
        next_funding_time: 'int64',
        timestamp: 'int64',
      },
    };
  }
}
