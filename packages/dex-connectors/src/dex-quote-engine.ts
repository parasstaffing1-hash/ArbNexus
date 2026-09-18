import Decimal from 'decimal.js';
import { DEXAdapterFactory } from './factory';
import { TokenMetadata } from './interfaces/dex.interface';
import { PoolRegistry } from './pool-registry';

export interface DEXQuoteRequest {
  chain: string;
  dex: string;
  token_in: TokenMetadata;
  token_out: TokenMetadata;
  amount_in: Decimal | string;
}

export interface UnifiedDEXQuote {
  token_in: TokenMetadata;
  token_out: TokenMetadata;
  amount_in: string;
  amount_out: string;
  execution_price: string;
  fee: string; // fee in quote token or USD
  price_impact: number; // in percent or bps
  route: string[];
  pool: string;
  gas_estimate: string; // in USD
  timestamp: number;
  data_quality: 'HIGH' | 'ESTIMATED' | 'STALE';
}

export class DEXQuoteEngine {
  private static instance: DEXQuoteEngine;
  private poolRegistry: PoolRegistry;

  private constructor() {
    this.poolRegistry = PoolRegistry.getInstance();
  }

  public static getInstance(): DEXQuoteEngine {
    if (!DEXQuoteEngine.instance) {
      DEXQuoteEngine.instance = new DEXQuoteEngine();
    }
    return DEXQuoteEngine.instance;
  }

  /**
   * Generates a unified, normalized quote across any supported DEX/Aggregator.
   */
  public async getQuote(request: DEXQuoteRequest): Promise<UnifiedDEXQuote> {
    const amountInDecimal = new Decimal(request.amount_in);
    if (amountInDecimal.lte(0)) {
      throw new Error('amount_in must be greater than zero');
    }

    const adapter = DEXAdapterFactory.getAdapter(request.dex);

    // Call underlying adapter quote method
    const quote = await adapter.getQuote(request.token_in, request.token_out, amountInDecimal);

    // Retrieve pool reference from registry if available
    const pools = this.poolRegistry.getPoolsByPair(
      request.chain,
      request.token_in.symbol,
      request.token_out.symbol,
    );
    const poolId =
      pools.find((p) => p.dex.toLowerCase() === request.dex.toLowerCase())?.pool_id ||
      pools[0]?.pool_id ||
      `${request.chain}-${request.dex}-${request.token_in.symbol}-${request.token_out.symbol}`;

    const feeAmount = amountInDecimal.mul('0.003').toString();

    return {
      token_in: request.token_in,
      token_out: request.token_out,
      amount_in: amountInDecimal.toString(),
      amount_out: quote.outputAmount,
      execution_price: quote.effectivePrice,
      fee: feeAmount,
      price_impact: quote.priceImpactBps / 100, // convert bps to percentage
      route: quote.route.length > 0 ? quote.route : [request.dex],
      pool: poolId,
      gas_estimate: quote.estimatedGasUsd,
      timestamp: Date.now(),
      data_quality: 'HIGH',
    };
  }

  /**
   * Compares quotes across multiple DEXs on a given chain for the same token pair.
   */
  public async compareQuotes(
    chain: string,
    dexList: string[],
    tokenIn: TokenMetadata,
    tokenOut: TokenMetadata,
    amountIn: Decimal | string,
  ): Promise<UnifiedDEXQuote[]> {
    const quotes = await Promise.allSettled(
      dexList.map((dex) =>
        this.getQuote({
          chain,
          dex,
          token_in: tokenIn,
          token_out: tokenOut,
          amount_in: amountIn,
        }),
      ),
    );

    return quotes
      .filter((q): q is PromiseFulfilledResult<UnifiedDEXQuote> => q.status === 'fulfilled')
      .map((q) => q.value)
      .sort((a, b) => new Decimal(b.amount_out).minus(new Decimal(a.amount_out)).toNumber());
  }
}
