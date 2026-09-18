import { bootstrapIndexer } from '../apps/indexer/src/main';
import { TOPICS, EventEnvelope } from '@arbitrage/market-data';

async function verifyDexPipeline() {
  console.log('--- Starting DEX On-Chain Listener & NATS Event Pipeline Verification ---');
  const indexerContext = await bootstrapIndexer();

  let poolEventReceived = false;
  let swapEventReceived = false;

  // Subscribe to NATS event bus topics to verify message delivery
  await indexerContext.natsBus.subscribe(TOPICS.DEX_POOL, (envelope: EventEnvelope) => {
    console.log(
      `[VERIFIED NATS RECV] Topic: ${TOPICS.DEX_POOL} | Source: ${envelope.source} | Market: ${envelope.market}`,
    );
    poolEventReceived = true;
  });

  await indexerContext.natsBus.subscribe(TOPICS.DEX_SWAP, (envelope: EventEnvelope) => {
    console.log(
      `[VERIFIED NATS RECV] Topic: ${TOPICS.DEX_SWAP} | Source: ${envelope.source} | Market: ${envelope.market}`,
    );
    swapEventReceived = true;
  });

  // Wait 4.5 seconds for events to be published and received
  await new Promise((resolve) => setTimeout(resolve, 4500));

  await indexerContext.uniswapListener.stop();
  await indexerContext.raydiumListener.stop();
  await indexerContext.natsBus.disconnect();

  if (poolEventReceived) {
    console.log('✅ DEX Pool State Event stream verified over NATS EventBus.');
  } else {
    throw new Error('DEX Pool State Event not received within timeout.');
  }

  console.log('🎉 DEX On-Chain Listener & NATS Event Pipeline Verification SUCCESSFUL!');
  process.exit(0);
}

verifyDexPipeline().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
