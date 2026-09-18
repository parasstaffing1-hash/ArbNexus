import Decimal from 'decimal.js';
import { DEXPoolInfo, TokenMetadata } from './interfaces/dex.interface';

export interface NormalizedPool {
  pool_id: string;
  chain: string;
  dex: string;
  token0: TokenMetadata;
  token1: TokenMetadata;
  fee: number; // in bps
  liquidity: string; // USD equivalent
  price: string; // token1 per token0
  reserves?: {
    reserve0: string;
    reserve1: string;
  };
  block_number: number;
  timestamp: number;
  status: 'ACTIVE' | 'STALE' | 'DEGRADED';
  source: 'EVENT_INDEXER' | 'RPC_READ' | 'QUOTE_API' | 'SEED';
}

export class PoolRegistry {
  private static instance: PoolRegistry;
  private pools: Map<string, NormalizedPool> = new Map();
  private pairIndex: Map<string, string[]> = new Map(); // key: "CHAIN:TOKENA:TOKENB" -> pool_ids

  private constructor() {
    this.seedDefaultPools();
  }

  public static getInstance(): PoolRegistry {
    if (!PoolRegistry.instance) {
      PoolRegistry.instance = new PoolRegistry();
    }
    return PoolRegistry.instance;
  }

  private getPairKey(chain: string, tokenA: string, tokenB: string): string {
    const sorted = [tokenA.toUpperCase(), tokenB.toUpperCase()].sort();
    return `${chain.toLowerCase()}:${sorted[0]}:${sorted[1]}`;
  }

  /**
   * Register or update a pool in the normalized registry.
   */
  public registerPool(pool: NormalizedPool): void {
    this.pools.set(pool.pool_id, pool);

    const pairKey = this.getPairKey(pool.chain, pool.token0.symbol, pool.token1.symbol);
    const existing = this.pairIndex.get(pairKey) || [];
    if (!existing.includes(pool.pool_id)) {
      existing.push(pool.pool_id);
      this.pairIndex.set(pairKey, existing);
    }
  }

  /**
   * Update pool price, reserves, and liquidity from on-chain event or quote read.
   */
  public updatePoolState(
    poolId: string,
    updates: Partial<
      Pick<
        NormalizedPool,
        'price' | 'liquidity' | 'reserves' | 'block_number' | 'status' | 'source'
      >
    >,
  ): NormalizedPool | null {
    const pool = this.pools.get(poolId);
    if (!pool) return null;

    const updated: NormalizedPool = {
      ...pool,
      ...updates,
      timestamp: Date.now(),
    };
    this.pools.set(poolId, updated);
    return updated;
  }

  public getPool(poolId: string): NormalizedPool | undefined {
    return this.pools.get(poolId);
  }

  public getPoolsByPair(chain: string, tokenA: string, tokenB: string): NormalizedPool[] {
    const pairKey = this.getPairKey(chain, tokenA, tokenB);
    const poolIds = this.pairIndex.get(pairKey) || [];
    return poolIds.map((id) => this.pools.get(id)!).filter(Boolean);
  }

  public getAllPools(): NormalizedPool[] {
    return Array.from(this.pools.values());
  }

  public getActivePoolsByChain(chain: string): NormalizedPool[] {
    return this.getAllPools().filter(
      (p) => p.chain.toLowerCase() === chain.toLowerCase() && p.status === 'ACTIVE',
    );
  }

  private seedDefaultPools() {
    // Seed high-liquidity foundational pools across Ethereum, Arbitrum, Base, and Solana
    this.registerPool({
      pool_id: 'eth-uniswap-v3-weth-usdc',
      chain: 'ethereum',
      dex: 'uniswap_v3',
      token0: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        chain: 'ethereum',
      },
      token1: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'ethereum',
      },
      fee: 5, // 0.05%
      liquidity: '450000000',
      price: '3524.50',
      reserves: { reserve0: '65000', reserve1: '229000000' },
      block_number: 20500120,
      timestamp: Date.now(),
      status: 'ACTIVE',
      source: 'SEED',
    });

    this.registerPool({
      pool_id: 'eth-uniswap-v3-wbtc-usdc',
      chain: 'ethereum',
      dex: 'uniswap_v3',
      token0: {
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        decimals: 8,
        chain: 'ethereum',
      },
      token1: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'ethereum',
      },
      fee: 30, // 0.30%
      liquidity: '280000000',
      price: '100000.00',
      reserves: { reserve0: '1400', reserve1: '140000000' },
      block_number: 20500120,
      timestamp: Date.now(),
      status: 'ACTIVE',
      source: 'SEED',
    });

    this.registerPool({
      pool_id: 'sol-raydium-sol-usdc',
      chain: 'solana',
      dex: 'raydium_clmm',
      token0: {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        chain: 'solana',
      },
      token1: {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'solana',
      },
      fee: 25, // 0.25%
      liquidity: '120000000',
      price: '188.00',
      reserves: { reserve0: '350000', reserve1: '65800000' },
      block_number: 280010050,
      timestamp: Date.now(),
      status: 'ACTIVE',
      source: 'SEED',
    });

    this.registerPool({
      pool_id: 'sol-orca-sol-usdc',
      chain: 'solana',
      dex: 'orca_whirlpool',
      token0: {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        chain: 'solana',
      },
      token1: {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'solana',
      },
      fee: 30,
      liquidity: '85000000',
      price: '188.25',
      reserves: { reserve0: '220000', reserve1: '41400000' },
      block_number: 280010050,
      timestamp: Date.now(),
      status: 'ACTIVE',
      source: 'SEED',
    });

    this.registerPool({
      pool_id: 'base-aerodrome-weth-usdc',
      chain: 'base',
      dex: 'aerodrome',
      token0: {
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        chain: 'base',
      },
      token1: {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'base',
      },
      fee: 5,
      liquidity: '95000000',
      price: '3527.20',
      reserves: { reserve0: '13500', reserve1: '47600000' },
      block_number: 20110000,
      timestamp: Date.now(),
      status: 'ACTIVE',
      source: 'SEED',
    });
  }
}
