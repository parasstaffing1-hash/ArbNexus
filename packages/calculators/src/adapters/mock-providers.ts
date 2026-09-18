import Decimal from 'decimal.js';
import {
  MarketDataProvider,
  FeeProvider,
  FundingProvider,
  BridgeProvider,
  GasProvider,
  OrderBookData,
  FeeSchedule,
  FundingRatePoint,
  BridgeQuote,
  GasQuote,
} from './provider.interface';

/**
 * Deterministic mock market data provider
 * All data returned here is explicitly labeled DEMO / SIMULATED.
 */
export class MockMarketDataProvider implements MarketDataProvider {
  readonly isDemo = true;
  readonly dataSource = 'DEMO / SIMULATED (Internal Mock)';

  async getPrice(symbol: string, exchange: string): Promise<Decimal> {
    const basePrices: Record<string, number> = {
      'BTC/USDT': 68500,
      'ETH/USDT': 2850,
      'SOL/USDT': 180,
    };
    const base = basePrices[symbol] || 100;
    // Slight deterministic variation per exchange
    const varianceMap: Record<string, number> = {
      binance: 0,
      bybit: 1.002,
      okx: 0.998,
      hyperliquid: 1.004,
      uniswap_v3: 0.995,
    };
    const factor = varianceMap[exchange.toLowerCase()] || 1.0;
    return new Decimal(base * factor);
  }

  async getOrderBook(symbol: string, exchange: string): Promise<OrderBookData> {
    const midPrice = await this.getPrice(symbol, exchange);
    const bids = [
      {
        price: midPrice.times('0.9995'),
        amount: new Decimal('2.5'),
        totalUsd: midPrice.times('2.498'),
      },
      {
        price: midPrice.times('0.9990'),
        amount: new Decimal('5.0'),
        totalUsd: midPrice.times('4.995'),
      },
      {
        price: midPrice.times('0.9980'),
        amount: new Decimal('12.0'),
        totalUsd: midPrice.times('11.976'),
      },
      {
        price: midPrice.times('0.9970'),
        amount: new Decimal('25.0'),
        totalUsd: midPrice.times('24.925'),
      },
      {
        price: midPrice.times('0.9950'),
        amount: new Decimal('60.0'),
        totalUsd: midPrice.times('59.700'),
      },
    ];
    const asks = [
      {
        price: midPrice.times('1.0005'),
        amount: new Decimal('2.5'),
        totalUsd: midPrice.times('2.501'),
      },
      {
        price: midPrice.times('1.0010'),
        amount: new Decimal('5.0'),
        totalUsd: midPrice.times('5.005'),
      },
      {
        price: midPrice.times('1.0020'),
        amount: new Decimal('12.0'),
        totalUsd: midPrice.times('12.024'),
      },
      {
        price: midPrice.times('1.0030'),
        amount: new Decimal('25.0'),
        totalUsd: midPrice.times('25.075'),
      },
      {
        price: midPrice.times('1.0050'),
        amount: new Decimal('60.0'),
        totalUsd: midPrice.times('60.300'),
      },
    ];

    return {
      symbol,
      exchange,
      timestamp: Date.now(),
      bids,
      asks,
    };
  }
}

export class MockFeeProvider implements FeeProvider {
  readonly isDemo = true;
  readonly dataSource = 'DEMO / SIMULATED (Exchange Fee Matrix)';

  async getFeeSchedule(exchange: string, vipTier = 0): Promise<FeeSchedule> {
    const defaultSchedules: Record<string, { maker: string; taker: string }> = {
      binance: { maker: '0.00075', taker: '0.00075' },
      bybit: { maker: '0.0002', taker: '0.00055' },
      okx: { maker: '0.0008', taker: '0.0010' },
      hyperliquid: { maker: '0.0000', taker: '0.00035' },
      uniswap_v3: { maker: '0.0005', taker: '0.0005' },
    };

    const config = defaultSchedules[exchange.toLowerCase()] || { maker: '0.001', taker: '0.001' };
    // VIP discount
    const discount = new Decimal(1).minus(new Decimal(vipTier).times('0.05'));

    return {
      exchange,
      vipTier,
      makerFeePercent: new Decimal(config.maker).times(discount).times(100),
      takerFeePercent: new Decimal(config.taker).times(discount).times(100),
      withdrawalFees: {
        USDT: new Decimal('1.0'),
        USDC: new Decimal('1.0'),
        ETH: new Decimal('0.0015'),
        BTC: new Decimal('0.0002'),
      },
      depositFeePercent: new Decimal(0),
    };
  }
}

export class MockFundingProvider implements FundingProvider {
  readonly isDemo = true;
  readonly dataSource = 'DEMO / SIMULATED (Perpetual Funding Oracle)';

  async getFundingRates(symbol: string): Promise<FundingRatePoint[]> {
    const now = Date.now();
    const nextFunding = Math.ceil(now / (8 * 3600 * 1000)) * (8 * 3600 * 1000);

    return [
      {
        symbol,
        exchange: 'Binance',
        fundingRate: new Decimal('0.012'), // 0.012%
        intervalHours: 8,
        predictedNextRate: new Decimal('0.013'),
        nextFundingTimestamp: nextFunding,
      },
      {
        symbol,
        exchange: 'Bybit',
        fundingRate: new Decimal('0.018'),
        intervalHours: 8,
        predictedNextRate: new Decimal('0.021'),
        nextFundingTimestamp: nextFunding,
      },
      {
        symbol,
        exchange: 'OKX',
        fundingRate: new Decimal('0.010'),
        intervalHours: 8,
        predictedNextRate: new Decimal('0.011'),
        nextFundingTimestamp: nextFunding,
      },
      {
        symbol,
        exchange: 'Hyperliquid',
        fundingRate: new Decimal('0.006'),
        intervalHours: 8,
        predictedNextRate: new Decimal('0.007'),
        nextFundingTimestamp: nextFunding,
      },
    ];
  }
}

export class MockBridgeProvider implements BridgeProvider {
  readonly isDemo = true;
  readonly dataSource = 'DEMO / SIMULATED (Cross-Chain Relayer Quotes)';

  async getBridgeQuotes(
    sourceChain: string,
    destChain: string,
    token: string,
    amount: Decimal,
  ): Promise<BridgeQuote[]> {
    return [
      {
        bridgeId: 'stargate_v2',
        bridgeName: 'Stargate V2 (LayerZero)',
        sourceChain,
        destChain,
        token,
        amount,
        feeUsd: new Decimal('3.50'),
        gasCostUsd: new Decimal('2.80'),
        estimatedDurationSeconds: 90,
        securityScore: 0.98,
      },
      {
        bridgeId: 'across',
        bridgeName: 'Across Protocol',
        sourceChain,
        destChain,
        token,
        amount,
        feeUsd: new Decimal('2.20'),
        gasCostUsd: new Decimal('1.90'),
        estimatedDurationSeconds: 120,
        securityScore: 0.96,
      },
      {
        bridgeId: 'lifi_diamond',
        bridgeName: 'LI.FI Diamond Route',
        sourceChain,
        destChain,
        token,
        amount,
        feeUsd: new Decimal('1.80'),
        gasCostUsd: new Decimal('2.10'),
        estimatedDurationSeconds: 75,
        securityScore: 0.95,
      },
    ];
  }
}

export class MockGasProvider implements GasProvider {
  readonly isDemo = true;
  readonly dataSource = 'DEMO / SIMULATED (EIP-1559 Oracle)';

  async getGasQuote(chain: string): Promise<GasQuote> {
    const chainMap: Record<
      string,
      { slow: string; std: string; fast: string; ethPrice: string; swapUsd: string }
    > = {
      ethereum: { slow: '12', std: '15', fast: '19', ethPrice: '2850', swapUsd: '1.45' },
      arbitrum: { slow: '0.05', std: '0.1', fast: '0.15', ethPrice: '2850', swapUsd: '0.02' },
      base: { slow: '0.02', std: '0.04', fast: '0.08', ethPrice: '2850', swapUsd: '0.01' },
      optimism: { slow: '0.03', std: '0.05', fast: '0.09', ethPrice: '2850', swapUsd: '0.015' },
      polygon: { slow: '25', std: '32', fast: '45', ethPrice: '0.45', swapUsd: '0.025' },
    };

    const val = chainMap[chain.toLowerCase()] || chainMap.ethereum;

    return {
      chain,
      slowGwei: new Decimal(val.slow),
      standardGwei: new Decimal(val.std),
      fastGwei: new Decimal(val.fast),
      nativePriceUsd: new Decimal(val.ethPrice),
      typicalSwapUsd: new Decimal(val.swapUsd),
    };
  }
}
