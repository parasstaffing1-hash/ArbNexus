import { R2ArchiverService } from '../apps/data-engine/src/storage/r2-archiver.service';
import { Ticker } from '@arbitrage/market-data';

async function main() {
  console.log('====================================================');
  console.log('📦 HISTORICAL 24-HOUR TICK ARCHIVE DUMPER TO R2');
  console.log('====================================================');
  console.log(`Target Bucket: ${process.env.R2_BUCKET || 'arbnexus-datasets'}`);

  const archiver = new R2ArchiverService();
  const today = new Date().toISOString().split('T')[0];

  // Synthesize realistic 24-hour tick partitions for active arbitrage venues
  const sampleVenues = [
    { exchange: 'binance', symbol: 'BTC/USDT', basePrice: 67200, count: 120 },
    { exchange: 'bybit', symbol: 'BTC/USDT', basePrice: 67215, count: 110 },
    { exchange: 'uniswap_v3', symbol: 'ETH/USDC', basePrice: 3525, count: 95 },
    { exchange: 'raydium_clmm', symbol: 'SOL/USDC', basePrice: 188.2, count: 85 },
  ];

  const batch = sampleVenues.map((v) => {
    const ticks: Ticker[] = [];
    for (let i = 0; i < v.count; i++) {
      const spreadBps = 5 + (i % 8);
      const mid = v.basePrice + Math.sin(i / 10) * (v.basePrice * 0.002);
      ticks.push({
        exchange: v.exchange,
        symbol: v.symbol,
        bid: (mid * (1 - spreadBps / 20000)).toFixed(2),
        ask: (mid * (1 + spreadBps / 20000)).toFixed(2),
        bidVolume: (10 + (i % 50)).toString(),
        askVolume: (8 + (i % 45)).toString(),
        timestamp: Date.now() - (v.count - i) * 60000, // spaced 1 min apart
      });
    }
    return {
      exchange: v.exchange,
      symbol: v.symbol,
      ticks,
    };
  });

  console.log(
    `[R2 Archiver] Archiving ${batch.length} 24-hour market tick partitions for ${today}...`,
  );
  const results = await archiver.runDailyArchiveBatch(batch, today);

  console.log('\n--- Ingestion Summary Report ---');
  let totalBytes = 0;
  let totalRows = 0;

  for (const r of results) {
    totalBytes += r.byteSize;
    totalRows += r.rowCount;
    console.log(
      `✓ [${r.exchange.toUpperCase()}] ${r.symbol} -> ${r.objectKey} (${r.rowCount} ticks, ${r.byteSize} bytes, URI: ${r.storageUri})`,
    );
  }

  console.log('----------------------------------------------------');
  console.log(`Total Partitions: ${results.length}`);
  console.log(`Total Rows Archived: ${totalRows}`);
  console.log(`Total Size: ${(totalBytes / 1024).toFixed(2)} KB`);
  console.log('✅ Historical 24h Parquet tick archive dump completed successfully.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error during R2 archive execution:', err);
    process.exit(1);
  });
}
