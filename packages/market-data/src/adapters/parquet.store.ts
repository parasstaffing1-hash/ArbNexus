import * as path from 'path';

export interface ParquetPartitionKey {
  exchange: string;
  symbol: string;
  date: string; // YYYY-MM-DD
  dataType: 'trades' | 'orderbook' | 'funding' | 'opportunities';
}

export class ParquetStore {
  private baseDirectory: string;

  constructor(baseDirectory: string = './market-data') {
    this.baseDirectory = baseDirectory;
  }

  /**
   * Builds standard Hive-style partitioned path:
   * /market-data/exchange={exchange}/symbol={symbol}/date={date}/{dataType}.parquet
   */
  getPartitionPath(key: ParquetPartitionKey): string {
    const cleanSymbol = key.symbol.replace(/[/:]/g, '');
    return path.join(
      this.baseDirectory,
      `exchange=${key.exchange.toLowerCase()}`,
      `symbol=${cleanSymbol.toUpperCase()}`,
      `date=${key.date}`,
      `${key.dataType}.parquet`,
    );
  }

  /**
   * Generates a glob pattern to scan partitions for a given exchange or symbol.
   */
  getScanGlob(filter: { exchange?: string; symbol?: string; dataType: string }): string {
    const ex = filter.exchange ? `exchange=${filter.exchange.toLowerCase()}` : 'exchange=*';
    const sym = filter.symbol
      ? `symbol=${filter.symbol.replace(/[/:]/g, '').toUpperCase()}`
      : 'symbol=*';
    return path
      .join(this.baseDirectory, ex, sym, 'date=*', `${filter.dataType}.parquet`)
      .replace(/\\/g, '/');
  }
}
