import { createClient, ClickHouseClient } from '@clickhouse/client';
import { AnalyticalDatabase, AnalyticalQueryResult } from './analytical-db.interface';
import { Ticker, Trade } from '../types';
import { ArbitrageOpportunity } from '@arbitrage/shared';

export class ClickHouseRepository implements AnalyticalDatabase {
  public readonly backendType = 'clickhouse' as const;
  private client: ClickHouseClient | null = null;
  private inMemoryFallbackTables: Map<string, any[]> = new Map();
  private isConnected = false;

  constructor(
    private config: {
      url?: string;
      username?: string;
      password?: string;
      database?: string;
    } = {},
  ) {
    const url = config.url || process.env.CLICKHOUSE_URL || 'http://localhost:8123';
    const username = config.username || process.env.CLICKHOUSE_USER || 'default';
    const password = config.password || process.env.CLICKHOUSE_PASSWORD || '';
    const database = config.database || process.env.CLICKHOUSE_DB || 'arbitrage_analytics';

    try {
      this.client = createClient({
        url,
        username,
        password,
        database,
        request_timeout: 3000,
      });
    } catch {
      this.client = null;
    }
  }

  public async connect(): Promise<void> {
    if (!this.client) return;
    try {
      const ping = await this.client.ping();
      this.isConnected = ping.success;
      if (this.isConnected) {
        await this.initializeSchemas();
      }
    } catch {
      this.isConnected = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  public async isHealthy(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const res = await this.client.ping();
      return res.success;
    } catch {
      return false;
    }
  }

  private async initializeSchemas(): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      // 1. Tickers table
      await this.client.command({
        query: `
          CREATE TABLE IF NOT EXISTS tickers (
            exchange LowCardinality(String),
            symbol LowCardinality(String),
            bid Float64,
            ask Float64,
            last Float64,
            timestamp DateTime64(3, 'UTC')
          ) ENGINE = MergeTree()
          ORDER BY (symbol, exchange, timestamp);
        `,
      });

      // 2. Opportunities table
      await this.client.command({
        query: `
          CREATE TABLE IF NOT EXISTS opportunities (
            id UUID,
            strategy_type LowCardinality(String),
            asset LowCardinality(String),
            gross_spread Float64,
            expected_net_profit Float64,
            expected_roi Float64,
            liquidity_score Float64,
            timestamp DateTime64(3, 'UTC')
          ) ENGINE = MergeTree()
          ORDER BY (strategy_type, asset, timestamp);
        `,
      });
    } catch {
      // Offline fallback
    }
  }

  public async insertBatch(table: string, columns: string[], rows: any[][]): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        const values = rows.map((r) => {
          const obj: Record<string, any> = {};
          columns.forEach((col, i) => {
            obj[col] = r[i];
          });
          return obj;
        });

        await this.client.insert({
          table,
          values,
          format: 'JSONEachRow',
        });
        return rows.length;
      } catch {
        // Fallback to local memory
      }
    }

    // In-memory fallback
    if (!this.inMemoryFallbackTables.has(table)) {
      this.inMemoryFallbackTables.set(table, []);
    }
    const store = this.inMemoryFallbackTables.get(table)!;
    rows.forEach((r) => {
      const obj: Record<string, any> = {};
      columns.forEach((col, i) => {
        obj[col] = r[i];
      });
      store.push(obj);
    });
    return rows.length;
  }

  public async insertTickers(tickers: Ticker[]): Promise<number> {
    const rows = tickers.map((t) => [
      t.exchange,
      t.symbol,
      parseFloat(t.bid || '0'),
      parseFloat(t.ask || '0'),
      parseFloat(t.last || '0'),
      new Date(t.timestamp),
    ]);
    return this.insertBatch(
      'tickers',
      ['exchange', 'symbol', 'bid', 'ask', 'last', 'timestamp'],
      rows,
    );
  }

  public async insertOpportunities(opportunities: ArbitrageOpportunity[]): Promise<number> {
    const rows = opportunities.map((opp) => [
      opp.id,
      opp.strategy,
      opp.pair,
      opp.spreadPercent || 0,
      opp.netProfitUsd || 0,
      opp.spreadPercent || 0,
      opp.confidenceScore || 0,
      new Date(opp.detectedAt),
    ]);
    return this.insertBatch(
      'opportunities',
      [
        'id',
        'strategy_type',
        'asset',
        'gross_spread',
        'expected_net_profit',
        'expected_roi',
        'liquidity_score',
        'timestamp',
      ],
      rows,
    );
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<AnalyticalQueryResult<T>> {
    const start = performance.now();
    if (this.isConnected && this.client) {
      try {
        const resultSet = await this.client.query({
          query: sql,
          format: 'JSONEachRow',
        });
        const rows = (await resultSet.json()) as T[];
        return {
          rows,
          rowCount: rows.length,
          executionTimeMs: performance.now() - start,
          columns: rows.length > 0 ? Object.keys(rows[0] as object) : [],
        };
      } catch {
        // Fall back to memory
      }
    }

    // In-memory fallback
    return {
      rows: [],
      rowCount: 0,
      executionTimeMs: performance.now() - start,
      columns: [],
    };
  }

  public async queryParquet<T = any>(
    parquetGlob: string,
    filterSql?: string,
  ): Promise<AnalyticalQueryResult<T>> {
    return this.query<T>(
      `SELECT * FROM file('${parquetGlob}', 'Parquet') ${filterSql ? `WHERE ${filterSql}` : ''}`,
    );
  }

  public async querySpreads(symbol: string, limit: number = 50): Promise<any[]> {
    const res = await this.query(`
      SELECT symbol, strategy_type, gross_spread, expected_net_profit, timestamp
      FROM opportunities
      WHERE symbol = '${symbol}'
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `);
    return res.rows;
  }
}
