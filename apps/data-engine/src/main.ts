import { InMemoryEventBus } from './bus/event-bus';
import { MarketIngestor } from './ingestion/market-ingestor';
import { ArbitragePipeline } from '@arbitrage/arbitrage-engine';
import { ParquetWriter } from './storage/parquet-writer';
import { TOPICS, EventEnvelope } from '@arbitrage/market-data';

export async function bootstrapDataEngine() {
  console.log('====================================================');
  console.log('🚀 ARBITRAGE DATA ENGINE INITIALIZING');
  console.log('====================================================');

  const eventBus = new InMemoryEventBus();
  const ingestor = new MarketIngestor(eventBus);
  const pipeline = new ArbitragePipeline();
  const parquetWriter = new ParquetWriter();

  // Wire event bus subscriber for validated arbitrage
  eventBus.subscribe(TOPICS.ARBITRAGE_VALIDATED, (envelope: EventEnvelope) => {
    console.log(
      `[DataEngine] Validated Opportunity: ${envelope.payload.id} | Net Profit: $${envelope.payload.expected_net_profit} | ROI: ${envelope.payload.expected_roi}%`,
    );
  });

  // Run initial poll cycle
  const tickers = await ingestor.pollTickers(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);
  console.log(`[DataEngine] Polled and validated ${tickers.length} exchange tickers.`);

  // Persist to DuckDB/Parquet
  await parquetWriter.persistTickers(tickers);
  console.log(`[DataEngine] Ingested tickers stored into analytical store.`);

  // Run arbitrage detection pipeline
  const opportunities = await pipeline.processTickers(tickers, 10000);
  console.log(
    `[DataEngine] Detected & Validated ${opportunities.length} live arbitrage opportunities.`,
  );

  for (const opp of opportunities) {
    await eventBus.publish(TOPICS.ARBITRAGE_VALIDATED, {
      event_id: `evt-${opp.id}`,
      timestamp: Date.now(),
      source: 'data-engine',
      market: opp.asset,
      payload: opp,
      schema_version: '1.0.0',
    });
  }

  return {
    ingestor,
    pipeline,
    eventBus,
    parquetWriter,
    activeOpportunities: opportunities,
  };
}

if (require.main === module) {
  bootstrapDataEngine().catch((err) => {
    console.error('Fatal error starting Data Engine:', err);
    process.exit(1);
  });
}
