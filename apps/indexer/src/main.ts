import { EVMEventIndexer } from './indexers/evm-event.indexer';
import {
  SolanaEventIndexer,
  PoolEventIndexer,
  LiquidationIndexer,
} from './indexers/solana-event.indexer';
import { UniswapV3PoolListener } from './indexers/uniswap-v3-pool.listener';
import { RaydiumPoolListener } from './indexers/raydium-pool.listener';
import { NatsEventBus, TOPICS, createEnvelope } from '@arbitrage/market-data';

export async function bootstrapIndexer() {
  console.log('====================================================');
  console.log('⛓️ BLOCKCHAIN & DEX ON-CHAIN INDEXER INITIALIZING');
  console.log('====================================================');

  // 1. Initialize NATS Event Bus with graceful in-memory fallback
  const natsBus = new NatsEventBus();
  await natsBus.connect();
  console.log('[Indexer] NATS JetStream Event Bus connected.');

  // 2. Base Chain Indexers
  const evmIndexer = new EVMEventIndexer();
  const solanaIndexer = new SolanaEventIndexer();

  await evmIndexer.start();
  await solanaIndexer.start();

  evmIndexer.onEvent((evt) => {
    console.log(
      `[Indexer] EVM Event Indexed: ${evt.chain.toUpperCase()} ${evt.eventType} on ${evt.contractAddress}`,
    );
  });

  // 3. Real-Time Uniswap v3 Pool State & Swap Listener (WETH/USDC 0.05%)
  const uniswapListener = new UniswapV3PoolListener({
    chain: 'ethereum',
    poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    token0: { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    token1: { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    feeBps: 5,
  });

  uniswapListener.on('pool_state', async (evt) => {
    const envelope = createEnvelope('uniswap_v3', 'ETH/USDC', evt.data, {
      exchangeTimestamp: evt.timestamp,
      eventId: evt.id,
    });
    await natsBus.publish(TOPICS.DEX_POOL, envelope);
    console.log(
      `[DEX:UniswapV3] Pool State Updated: ETH/USDC @ $${evt.data.currentPrice} | Tick: ${evt.data.tick} | Block: ${evt.blockNumber}`,
    );
  });

  uniswapListener.on('swap', async (evt) => {
    const envelope = createEnvelope('uniswap_v3', 'ETH/USDC', evt.data, {
      exchangeTimestamp: evt.timestamp,
      eventId: evt.id,
    });
    await natsBus.publish(TOPICS.DEX_SWAP, envelope);
    console.log(
      `[DEX:UniswapV3] Swap Broadcasted: Tx ${evt.txHash.slice(0, 10)}... | In: ${evt.data.amount0In || evt.data.amount1In} | Out: ${evt.data.amount0Out || evt.data.amount1Out}`,
    );
  });

  await uniswapListener.start();
  console.log('[Indexer] Uniswap v3 Real-Time Pool Listener active.');

  // 4. Real-Time Raydium CLMM Pool State & Swap Listener (SOL/USDC)
  const raydiumListener = new RaydiumPoolListener({
    poolAddress: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',
    tokenBase: { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
    tokenQuote: {
      symbol: 'USDC',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
    },
  });

  raydiumListener.on('pool_state', async (evt) => {
    const envelope = createEnvelope('raydium_clmm', 'SOL/USDC', evt.data, {
      exchangeTimestamp: evt.timestamp,
      eventId: evt.id,
    });
    await natsBus.publish(TOPICS.DEX_POOL, envelope);
    console.log(
      `[DEX:Raydium] Pool State Updated: SOL/USDC @ $${evt.data.currentPrice} | Slot: ${evt.blockNumber} | Reserves: ${evt.data.baseVaultReserve} SOL / ${evt.data.quoteVaultReserve} USDC`,
    );
  });

  raydiumListener.on('swap', async (evt) => {
    const envelope = createEnvelope('raydium_clmm', 'SOL/USDC', evt.data, {
      exchangeTimestamp: evt.timestamp,
      eventId: evt.id,
    });
    await natsBus.publish(TOPICS.DEX_SWAP, envelope);
    console.log(
      `[DEX:Raydium] Swap Broadcasted: Tx ${evt.txHash.slice(0, 10)}... | Block: ${evt.blockNumber}`,
    );
  });

  await raydiumListener.start();
  console.log('[Indexer] Raydium Real-Time Pool Listener active.');

  // 5. Initial simulated pipeline test event
  const testSwap = PoolEventIndexer.normalizeSwapEvent(
    'arbitrum',
    '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443',
    {
      sender: '0x1234567890123456789012345678901234567890',
      amount0In: '10000.00',
      amount1In: '0.0',
      amount0Out: '0.0',
      amount1Out: '2.83',
      txHash: '0xabc123456789abcdef',
      blockNumber: 220000000,
    },
  );

  await evmIndexer.dispatchSimulatedEvent(testSwap);
  console.log('[Indexer] All blockchain & DEX indexing listeners running smoothly.');

  return {
    evmIndexer,
    solanaIndexer,
    uniswapListener,
    raydiumListener,
    natsBus,
  };
}

if (require.main === module) {
  bootstrapIndexer().catch((err) => {
    console.error('Fatal error starting Indexer:', err);
    process.exit(1);
  });
}
