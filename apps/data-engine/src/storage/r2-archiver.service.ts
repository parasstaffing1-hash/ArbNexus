import { R2StorageProvider, Ticker, Trade, DataFrameAdapter } from '@arbitrage/market-data';
import * as crypto from 'crypto';

export interface TickArchiveResult {
  exchange: string;
  symbol: string;
  date: string;
  objectKey: string;
  storageUri: string;
  rowCount: number;
  byteSize: number;
  checksumSha256: string;
  timestamp: number;
}

export interface ArchiverConfig {
  bucket?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  localFallbackDir?: string;
}

export class R2ArchiverService {
  private r2Provider: R2StorageProvider;
  private bucket: string;

  constructor(config: ArchiverConfig = {}) {
    this.bucket = config.bucket || process.env.R2_BUCKET || 'arbnexus-datasets';
    this.r2Provider = new R2StorageProvider({
      bucket: this.bucket,
      endpoint: config.endpoint || process.env.R2_ENDPOINT,
      accessKeyId: config.accessKeyId || process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: config.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY,
      localFallbackDir: config.localFallbackDir,
    });
  }

  public getProvider(): R2StorageProvider {
    return this.r2Provider;
  }

  /**
   * Generates and archives a 24-hour tick partition into the Cloudflare R2 bucket (arbnexus-datasets).
   */
  public async archive24HourTicks(
    exchange: string,
    symbol: string,
    ticks: (Trade | Ticker)[],
    targetDate?: string,
  ): Promise<TickArchiveResult> {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];
    const cleanSymbol = symbol.replace(/[/:]/g, '').toUpperCase();
    const exLower = exchange.toLowerCase();

    // Serialize ticks into columnar or binary JSON/Parquet payload
    const serializedPayload = JSON.stringify({
      version: '1.0.0',
      archiveType: '24h_tick_data',
      exchange: exLower,
      symbol: cleanSymbol,
      date: dateStr,
      generatedAt: Date.now(),
      rowCount: ticks.length,
      records: ticks,
    });

    const buffer = Buffer.from(serializedPayload, 'utf-8');
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Hive-style partitioned key structure
    const objectKey = `archives/24h/date=${dateStr}/exchange=${exLower}/symbol=${cleanSymbol}/ticks.parquet`;

    const storageUri = await this.r2Provider.uploadFile(
      objectKey,
      buffer,
      'application/octet-stream',
    );

    return {
      exchange: exLower,
      symbol: cleanSymbol,
      date: dateStr,
      objectKey,
      storageUri,
      rowCount: ticks.length,
      byteSize: buffer.length,
      checksumSha256: checksum,
      timestamp: Date.now(),
    };
  }

  /**
   * Archives a batch of 24h market snapshots across default monitored pairs.
   */
  public async runDailyArchiveBatch(
    markets: { exchange: string; symbol: string; ticks: (Trade | Ticker)[] }[],
    targetDate?: string,
  ): Promise<TickArchiveResult[]> {
    const results: TickArchiveResult[] = [];
    for (const m of markets) {
      const res = await this.archive24HourTicks(m.exchange, m.symbol, m.ticks, targetDate);
      results.push(res);
    }
    return results;
  }
}
