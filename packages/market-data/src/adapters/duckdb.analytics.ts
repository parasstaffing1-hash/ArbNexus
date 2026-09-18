import {
  AnalyticalDatabase,
  AnalyticalBackendType,
  AnalyticalQueryResult,
} from './analytical-db.interface';

export class DuckDBAnalyticsService implements AnalyticalDatabase {
  readonly backendType: AnalyticalBackendType = 'duckdb';
  private connected: boolean = false;
  private tables: Map<string, any[]> = new Map();

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.tables.clear();
  }

  async isHealthy(): Promise<boolean> {
    return this.connected;
  }

  async insertBatch(table: string, columns: string[], rows: any[][]): Promise<number> {
    if (!this.tables.has(table)) {
      this.tables.set(table, []);
    }
    const current = this.tables.get(table)!;
    for (const r of rows) {
      const obj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        obj[col] = r[idx];
      });
      current.push(obj);
    }
    return rows.length;
  }

  async query<T = any>(sql: string, _params?: any[]): Promise<AnalyticalQueryResult<T>> {
    const start = Date.now();
    // In-memory analytical table scan
    const match = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const tableName = match ? match[1].toLowerCase() : null;
    const rows = tableName && this.tables.has(tableName) ? (this.tables.get(tableName) as T[]) : [];

    return {
      rows,
      rowCount: rows.length,
      executionTimeMs: Math.max(1, Date.now() - start),
      columns: rows.length > 0 ? Object.keys(rows[0] as object) : [],
    };
  }

  async queryParquet<T = any>(
    parquetGlob: string,
    filterSql?: string,
  ): Promise<AnalyticalQueryResult<T>> {
    const start = Date.now();
    // Simulates Parquet query: SELECT * FROM read_parquet('...')
    return {
      rows: [] as T[],
      rowCount: 0,
      executionTimeMs: Math.max(1, Date.now() - start),
      columns: ['timestamp', 'price', 'amount', 'exchange', 'symbol'],
    };
  }
}
