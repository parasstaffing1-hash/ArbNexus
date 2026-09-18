import {
  DEXAdapter,
  DEXPoolInfo,
  DEXQuote,
  DEXRoute,
  TokenMetadata,
} from '../interfaces/dex.interface';
import Decimal from 'decimal.js';

export class OneInchAdapter implements DEXAdapter {
  readonly dexId = '1inch';
  readonly dexName = '1inch Pathfinder Aggregator';
  readonly chain = 'arbitrum';

  async getPool(
    _tokenIn: string,
    _tokenOut: string,
    feeBps: number = 10,
  ): Promise<DEXPoolInfo | null> {
    return {
      poolAddress: '1INCH-AGG-ARB',
      dexId: this.dexId,
      chain: this.chain,
      token0: {
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        chain: this.chain,
      },
      token1: {
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        chain: this.chain,
      },
      reserve0: '25000',
      reserve1: '88100000',
      feeBps,
      liquidityUsd: '176200000',
      currentPrice: '3524.00',
    };
  }

  async getQuote(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXQuote> {
    const isWethInput = inputToken.symbol.includes('ETH');
    const basePrice = isWethInput ? new Decimal('3524.20') : new Decimal('1').div('3524.20');
    const outputAmount = inputAmount.mul(basePrice).mul('0.999');

    return {
      dexId: this.dexId,
      chain: this.chain,
      inputToken,
      outputToken,
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
      effectivePrice: outputAmount.div(inputAmount).toString(),
      priceImpactBps: 0.08,
      estimatedGasUsd: '0.15',
      route: ['1inch Pathfinder Split: Uniswap v3 70% + Camelot 30%'],
    };
  }

  async getLiquidity(_poolAddress: string): Promise<Decimal> {
    return new Decimal('176200000');
  }

  async getRoutes(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXRoute[]> {
    const quote = await this.getQuote(inputToken, outputToken, inputAmount);
    return [
      {
        protocol: '1inch Pathfinder',
        hops: [
          {
            poolAddress: '1INCH-MULTI-HOP',
            fromToken: inputToken.symbol,
            toToken: outputToken.symbol,
            feeBps: 10,
          },
        ],
        expectedReturn: quote.outputAmount,
        minReturnWithSlippage: new Decimal(quote.outputAmount).mul('0.997').toString(),
      },
    ];
  }

  async getTokenMetadata(address: string): Promise<TokenMetadata | null> {
    return {
      address,
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chain: this.chain,
    };
  }
}
