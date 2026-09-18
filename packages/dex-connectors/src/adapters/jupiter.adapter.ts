import {
  DEXAdapter,
  DEXPoolInfo,
  DEXQuote,
  DEXRoute,
  TokenMetadata,
} from '../interfaces/dex.interface';
import Decimal from 'decimal.js';

export class JupiterAdapter implements DEXAdapter {
  readonly dexId = 'jupiter';
  readonly dexName = 'Jupiter Aggregator';
  readonly chain = 'solana';

  async getPool(
    _tokenIn: string,
    _tokenOut: string,
    feeBps: number = 20,
  ): Promise<DEXPoolInfo | null> {
    return {
      poolAddress: 'SOL-USDC-JUP-ROUTER',
      dexId: this.dexId,
      chain: this.chain,
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
      reserve0: '350000',
      reserve1: '65800000',
      feeBps,
      liquidityUsd: '131600000',
      currentPrice: '188.00',
    };
  }

  async getQuote(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXQuote> {
    const isSolInput = inputToken.symbol.includes('SOL');
    const basePrice = isSolInput ? new Decimal('188.00') : new Decimal('1').div('188.00');
    const feeMult = new Decimal(1).minus(new Decimal('0.001')); // 0.1% dynamic fee

    const outputAmount = inputAmount.mul(basePrice).mul(feeMult);

    return {
      dexId: this.dexId,
      chain: this.chain,
      inputToken,
      outputToken,
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
      effectivePrice: outputAmount.div(inputAmount).toString(),
      priceImpactBps: 0.05,
      estimatedGasUsd: '0.0015',
      route: ['Jupiter Optimal Split -> Orca Whirlpool 60% + Raydium CLMM 40%'],
    };
  }

  async getLiquidity(_poolAddress: string): Promise<Decimal> {
    return new Decimal('131600000');
  }

  async getRoutes(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXRoute[]> {
    const quote = await this.getQuote(inputToken, outputToken, inputAmount);
    return [
      {
        protocol: 'Jupiter Metarouting',
        hops: [
          {
            poolAddress: 'SOL-USDC-JUP-SPLIT',
            fromToken: inputToken.symbol,
            toToken: outputToken.symbol,
            feeBps: 10,
          },
        ],
        expectedReturn: quote.outputAmount,
        minReturnWithSlippage: new Decimal(quote.outputAmount).mul('0.998').toString(),
      },
    ];
  }

  async getTokenMetadata(address: string): Promise<TokenMetadata | null> {
    return {
      address,
      symbol: 'SOL',
      name: 'Wrapped SOL',
      decimals: 9,
      chain: this.chain,
    };
  }
}
