import {
  ParquetStore,
  DataFrameAdapter,
  Ticker,
  Trade,
  FundingRate,
  DuckDBAnalyticsService,
} from '@arbitrage/market-data';

export class ParquetWriter {
  private parquetStore: ParquetStore;
  private duckDb: DuckDBAnalyticsService;

  constructor(baseDir: string = './market-data') {
    this.parquetStore = new ParquetStore(baseDir);
    this.duckDb = new DuckDBAnalyticsService();
  }

  async persistTickers(tickers: Ticker[]): Promise<number> {
    if (tickers.length === 0) return 0;
    const columnar = DataFrameAdapter.tickersToColumnar(tickers);
    const rows: any[][] = [];

    for (let i = 0; i < columnar.rowCount; i++) {
      const row = Object.keys(columnar.columns).map((col) => columnar.columns[col][i]);
      rows.push(row);
    }

    await this.duckDb.connect();
    return this.duckDb.insertBatch('tickers', Object.keys(columnar.columns), rows);
  }

  getPartitionPath(
    exchange: string,
    symbol: string,
    date: string,
    dataType: 'trades' | 'orderbook' | 'funding' | 'opportunities',
  ): string {
    return this.parquetStore.getPartitionPath({ exchange, symbol, date, dataType });
  }
}
