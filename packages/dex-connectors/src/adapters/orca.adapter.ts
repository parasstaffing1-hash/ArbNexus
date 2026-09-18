import {
  DEXAdapter,
  DEXPoolInfo,
  DEXQuote,
  DEXRoute,
  TokenMetadata,
} from '../interfaces/dex.interface';
import Decimal from 'decimal.js';

export class OrcaAdapter implements DEXAdapter {
  readonly dexId = 'orca_whirlpool';
  readonly dexName = 'Orca Whirlpools';
  readonly chain = 'solana';

  async getPool(
    _tokenIn: string,
    _tokenOut: string,
    feeBps: number = 30,
  ): Promise<DEXPoolInfo | null> {
    return {
      poolAddress: 'ORCA-SOL-USDC-WHIRLPOOL',
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
      reserve0: '220000',
      reserve1: '41360000',
      feeBps,
      liquidityUsd: '82720000',
      currentPrice: '188.02',
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
    const basePrice = isSol ? new Decimal('188.02') : new Decimal('1').div('188.02');
    const outputAmount = inputAmount.mul(basePrice).mul('0.997');

    return {
      dexId: this.dexId,
      chain: this.chain,
      inputToken,
      outputToken,
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
      effectivePrice: outputAmount.div(inputAmount).toString(),
      priceImpactBps: 0.09,
      estimatedGasUsd: '0.0018',
      route: ['Orca Whirlpool SOL/USDC 0.30%'],
    };
  }

  async getLiquidity(_poolAddress: string): Promise<Decimal> {
    return new Decimal('82720000');
  }

  async getRoutes(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXRoute[]> {
    const quote = await this.getQuote(inputToken, outputToken, inputAmount);
    return [
      {
        protocol: 'Orca Whirlpool',
        hops: [
          {
            poolAddress: 'ORCA-SOL-USDC-WHIRLPOOL',
            fromToken: inputToken.symbol,
            toToken: outputToken.symbol,
            feeBps: 30,
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
