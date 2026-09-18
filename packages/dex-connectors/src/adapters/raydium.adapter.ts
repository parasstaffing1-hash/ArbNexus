import {
  DEXAdapter,
  DEXPoolInfo,
  DEXQuote,
  DEXRoute,
  TokenMetadata,
} from '../interfaces/dex.interface';
import Decimal from 'decimal.js';

export class RaydiumAdapter implements DEXAdapter {
  readonly dexId = 'raydium_clmm';
  readonly dexName = 'Raydium CLMM';
  readonly chain = 'solana';

  async getPool(
    _tokenIn: string,
    _tokenOut: string,
    feeBps: number = 25,
  ): Promise<DEXPoolInfo | null> {
    return {
      poolAddress: 'RAY-SOL-USDC-CLMM',
      dexId: this.dexId,
      chain: this.chain,
      token0: {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        chain: this.chain,
      },
      token1: {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: this.chain,
      },
      reserve0: '180000',
      reserve1: '33840000',
      feeBps,
      liquidityUsd: '67680000',
      currentPrice: '188.05',
      isV3Concentrated: true,
      tickSpacing: 64,
    };
  }

  async getQuote(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXQuote> {
    const isSol = inputToken.symbol.includes('SOL');
    const basePrice = isSol ? new Decimal('188.05') : new Decimal('1').div('188.05');
    const outputAmount = inputAmount.mul(basePrice).mul('0.9975');

    return {
      dexId: this.dexId,
      chain: this.chain,
      inputToken,
      outputToken,
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
      effectivePrice: outputAmount.div(inputAmount).toString(),
      priceImpactBps: 0.12,
      estimatedGasUsd: '0.002',
      route: ['Raydium Concentrated Pool SOL/USDC 0.25%'],
    };
  }

  async getLiquidity(_poolAddress: string): Promise<Decimal> {
    return new Decimal('67680000');
  }

  async getRoutes(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXRoute[]> {
    const quote = await this.getQuote(inputToken, outputToken, inputAmount);
    return [
      {
        protocol: 'Raydium CLMM',
        hops: [
          {
            poolAddress: 'RAY-SOL-USDC-CLMM',
            fromToken: inputToken.symbol,
            toToken: outputToken.symbol,
            feeBps: 25,
          },
        ],
        expectedReturn: quote.outputAmount,
        minReturnWithSlippage: new Decimal(quote.outputAmount).mul('0.995').toString(),
      },
    ];
  }

  async getTokenMetadata(address: string): Promise<TokenMetadata | null> {
    return {
      address,
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      chain: this.chain,
    };
  }
}
