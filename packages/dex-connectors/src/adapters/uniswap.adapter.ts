import {
  DEXAdapter,
  DEXPoolInfo,
  DEXQuote,
  DEXRoute,
  TokenMetadata,
} from '../interfaces/dex.interface';
import Decimal from 'decimal.js';

export class UniswapAdapter implements DEXAdapter {
  readonly dexId = 'uniswap_v3';
  readonly dexName = 'Uniswap V3';
  readonly chain = 'ethereum';

  async getPool(
    tokenIn: string,
    tokenOut: string,
    feeBps: number = 30,
  ): Promise<DEXPoolInfo | null> {
    const isWethUsdt =
      (tokenIn.includes('ETH') && tokenOut.includes('USDT')) ||
      (tokenIn.includes('USDT') && tokenOut.includes('ETH'));
    const price = isWethUsdt ? '3524.50' : '1.00';
    return {
      poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      dexId: this.dexId,
      chain: this.chain,
      token0: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        chain: 'ethereum',
      },
      token1: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        chain: 'ethereum',
      },
      reserve0: '45000',
      reserve1: '158600000',
      feeBps,
      liquidityUsd: '317200000',
      currentPrice: price,
      isV3Concentrated: true,
      tickSpacing: 60,
    };
  }

  async getQuote(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXQuote> {
    const isWethInput = inputToken.symbol.includes('ETH');
    const basePrice = isWethInput ? new Decimal('3524.50') : new Decimal('1').div('3524.50');
    const feeMult = new Decimal(1).minus(new Decimal('0.003')); // 0.30% fee

    // Constant product / tick price impact approximation
    const depthUsd = new Decimal('317200000');
    const tradeUsd = isWethInput ? inputAmount.mul(3524.5) : inputAmount;
    const impactBps = tradeUsd.div(depthUsd).mul(10000).toNumber();

    const outputAmount = inputAmount
      .mul(basePrice)
      .mul(feeMult)
      .mul(new Decimal(1).minus(impactBps / 10000));

    return {
      dexId: this.dexId,
      chain: this.chain,
      inputToken,
      outputToken,
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
      effectivePrice: outputAmount.div(inputAmount).toString(),
      priceImpactBps: Math.max(0.1, impactBps),
      estimatedGasUsd: '6.50',
      route: ['Uniswap V3 WETH/USDT 0.3% Pool'],
    };
  }

  async getLiquidity(_poolAddress: string): Promise<Decimal> {
    return new Decimal('317200000');
  }

  async getRoutes(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXRoute[]> {
    const quote = await this.getQuote(inputToken, outputToken, inputAmount);
    return [
      {
        protocol: 'Uniswap V3',
        hops: [
          {
            poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
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
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chain: this.chain,
    };
  }
}
