import {
  DEXAdapter,
  DEXPoolInfo,
  DEXQuote,
  DEXRoute,
  TokenMetadata,
} from '../interfaces/dex.interface';
import Decimal from 'decimal.js';

export class LiFiAdapter implements DEXAdapter {
  readonly dexId = 'lifi';
  readonly dexName = 'LI.FI Cross-Chain Bridge & DEX Aggregator';
  readonly chain = 'multi-chain';

  async getPool(
    _tokenIn: string,
    _tokenOut: string,
    feeBps: number = 15,
  ): Promise<DEXPoolInfo | null> {
    return {
      poolAddress: 'LIFI-MULTI-CHAIN-ROUTER',
      dexId: this.dexId,
      chain: this.chain,
      token0: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'ethereum',
      },
      token1: {
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'arbitrum',
      },
      reserve0: '50000000',
      reserve1: '50000000',
      feeBps,
      liquidityUsd: '100000000',
      currentPrice: '1.00',
    };
  }

  async getQuote(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXQuote> {
    const isSameChain = inputToken.chain === outputToken.chain;
    const bridgeFeeBps = isSameChain ? 0 : 10; // 0.10% bridge fee
    const swapFeeBps = 5; // 0.05% aggregator swap fee
    const totalFeeRate = new Decimal(1).minus(new Decimal(bridgeFeeBps + swapFeeBps).div(10000));
    const outputAmount = inputAmount.mul(totalFeeRate);
    const effectivePrice = inputAmount.gt(0) ? outputAmount.div(inputAmount).toString() : '1.00';

    return {
      dexId: this.dexId,
      chain: `${inputToken.chain ?? 'ethereum'}->${outputToken.chain ?? 'arbitrum'}`,
      inputToken,
      outputToken,
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
      effectivePrice,
      priceImpactBps: 2,
      estimatedGasUsd: isSameChain ? '3.50' : '12.80',
      route: ['LIFI-CROSS-CHAIN-STG', 'LIFI-UNISWAP-V3'],
    };
  }

  async getLiquidity(_poolAddress: string): Promise<Decimal> {
    return new Decimal('100000000');
  }

  async getRoutes(
    inputToken: TokenMetadata,
    outputToken: TokenMetadata,
    inputAmount: Decimal,
  ): Promise<DEXRoute[]> {
    const quote = await this.getQuote(inputToken, outputToken, inputAmount);
    return [
      {
        protocol: 'LI.FI Multi-Chain Aggregator',
        hops: [
          {
            poolAddress: 'LIFI-BRIDGE-STG',
            fromToken: inputToken.symbol,
            toToken: outputToken.symbol,
            feeBps: 15,
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
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chain: this.chain,
    };
  }
}
