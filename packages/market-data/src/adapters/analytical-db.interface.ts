export type AnalyticalBackendType = 'duckdb' | 'questdb' | 'clickhouse' | 'timescaledb';

export interface AnalyticalQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  executionTimeMs: number;
  columns: string[];
}

export interface AnalyticalDatabase {
  readonly backendType: AnalyticalBackendType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<AnalyticalQueryResult<T>>;
  queryParquet<T = any>(parquetGlob: string, filterSql?: string): Promise<AnalyticalQueryResult<T>>;
  insertBatch(table: string, columns: string[], rows: any[][]): Promise<number>;
  isHealthy(): Promise<boolean>;
}
