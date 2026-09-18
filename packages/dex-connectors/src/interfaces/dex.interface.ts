import Decimal from 'decimal.js';

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chain: string; // 'ethereum', 'arbitrum', 'base', 'solana', etc.
}

export interface DEXPoolInfo {
  poolAddress: string;
  dexId: string;
  chain: string;
  token0: TokenMetadata;
  token1: TokenMetadata;
  reserve0: string;
  reserve1: string;
  feeBps: number; // e.g. 30 for 0.30%
  liquidityUsd: string;
  currentPrice: string; // token1 per token0
  isV3Concentrated?: boolean;
  tickSpacing?: number;
}

export interface DEXQuote {
  dexId: string;
  chain: string;
  inputToken: TokenMetadata;
  outputToken: TokenMetadata;
  inputAmount: string;
  outputAmount: string;
  effectivePrice: string;
  priceImpactBps: number;
  estimatedGasUsd: string;
  route: string[]; // pool addresses or hop names
}

export interface DEXRoute {
  protocol: string;
  hops: {
    poolAddress: string;
    fromToken: string;
    toToken: string;
    feeBps: number;
  }[];
  expectedReturn: string;
  minReturnWithSlippage: string;
}

export interface DEXAdapter {
  readonly dexId: string;
  readonly dexName: string;
  readonly chain: string;

  getPool(tokenIn: string, tokenOut: string, feeBps?: number): Promise<DEXPoolInfo | null>;
  getQuote(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXQuote>;
  getLiquidity(poolAddress: string): Promise<Decimal>;
  getRoutes(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXRoute[]>;
  getTokenMetadata(address: string): Promise<TokenMetadata | null>;
}

export interface QuoteProvider {
  getQuote(
    chain: string,
    dex: string,
    tokenIn: TokenMetadata,
    tokenOut: TokenMetadata,
    amountIn: Decimal,
  ): Promise<DEXQuote>;
}

export interface PoolProvider {
  getPool(chain: string, dex: string, poolAddress: string): Promise<DEXPoolInfo | null>;
  findPool(
    chain: string,
    dex: string,
    token0: string,
    token1: string,
    feeBps?: number,
  ): Promise<DEXPoolInfo | null>;
}

export interface LiquidityProvider {
  getLiquidity(chain: string, dex: string, poolAddress: string): Promise<Decimal>;
  getDepth(
    chain: string,
    dex: string,
    poolAddress: string,
    maxSlippageBps?: number,
  ): Promise<{ bidDepthUsd: Decimal; askDepthUsd: Decimal }>;
}

export interface RouteProvider {
  getRoutes(
    chain: string,
    tokenIn: TokenMetadata,
    tokenOut: TokenMetadata,
    amountIn: Decimal,
    maxHops?: number,
  ): Promise<DEXRoute[]>;
}

export interface DEXFeeProvider {
  getFeeTiers(chain: string, dex: string): number[]; // e.g. [1, 5, 30, 100] for 0.01%, 0.05%, 0.3%, 1%
  getFeeBps(chain: string, dex: string, poolAddress: string): Promise<number>;
}
