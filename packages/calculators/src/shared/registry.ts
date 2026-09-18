import { CalculatorMeta } from './types';

export const CALCULATOR_REGISTRY: CalculatorMeta[] = [
  // 1. Spot Arbitrage Category
  {
    id: 'spot-arbitrage',
    slug: 'spot-arbitrage',
    category: 'arbitrage',
    name: 'Spot Arbitrage Calculator',
    description:
      'Calculates gross spread, itemized fees, slippage buffer, and net profit between two spot exchanges.',
    formulaDescription: 'Net Profit = (P_sell * Q) - (P_buy * Q) - Total_Fees',
    icon: 'ScanLine',
    status: 'ACTIVE',
    supportedExchanges: ['Binance', 'Bybit', 'OKX', 'Coinbase', 'Uniswap V3', 'Raydium'],
    parameters: [
      {
        name: 'buyPrice',
        label: 'Buy Price ($)',
        type: 'number',
        defaultValue: 2840.0,
        min: 0.0001,
        unit: 'USD',
      },
      {
        name: 'sellPrice',
        label: 'Sell Price ($)',
        type: 'number',
        defaultValue: 2865.0,
        min: 0.0001,
        unit: 'USD',
      },
      { name: 'quantity', label: 'Trade Quantity', type: 'number', defaultValue: 1.5, min: 0.0001 },
      {
        name: 'sourceTradingFeePercent',
        label: 'Buy Exchange Fee (%)',
        type: 'number',
        defaultValue: 0.1,
        step: 0.01,
        unit: '%',
        isAdvanced: true,
      },
      {
        name: 'targetTradingFeePercent',
        label: 'Sell Exchange Fee (%)',
        type: 'number',
        defaultValue: 0.075,
        step: 0.01,
        unit: '%',
        isAdvanced: true,
      },
      {
        name: 'networkGasCostUsd',
        label: 'Gas / Network Fee ($)',
        type: 'number',
        defaultValue: 2.5,
        min: 0,
        unit: 'USD',
        isAdvanced: true,
      },
      {
        name: 'withdrawalFeeUsd',
        label: 'Withdrawal Fee ($)',
        type: 'number',
        defaultValue: 1.0,
        min: 0,
        unit: 'USD',
        isAdvanced: true,
      },
      {
        name: 'slippagePercent',
        label: 'Slippage Buffer (%)',
        type: 'number',
        defaultValue: 0.05,
        min: 0,
        unit: '%',
        isAdvanced: true,
      },
    ],
  },
  {
    id: 'gross-spread',
    slug: 'gross-spread',
    category: 'arbitrage',
    name: 'Gross Spread Calculator',
    description: 'Measures raw price divergence between two markets before any fees.',
    formulaDescription: 'Gross Spread % = ((P_sell - P_buy) / P_buy) * 100',
    icon: 'TrendingUp',
    status: 'ACTIVE',
    parameters: [
      { name: 'buyPrice', label: 'Buy Price ($)', type: 'number', defaultValue: 100, min: 0.001 },
      {
        name: 'sellPrice',
        label: 'Sell Price ($)',
        type: 'number',
        defaultValue: 101.5,
        min: 0.001,
      },
    ],
  },
  {
    id: 'net-spread',
    slug: 'net-spread',
    category: 'arbitrage',
    name: 'Net Spread Calculator',
    description:
      'Calculates real executable spread after deducting all variable transaction fee rates.',
    formulaDescription: 'Net Spread % = Gross Spread % - Total Fee Rate %',
    icon: 'Activity',
    status: 'ACTIVE',
    parameters: [
      { name: 'buyPrice', label: 'Buy Price ($)', type: 'number', defaultValue: 2840, min: 0.001 },
      {
        name: 'sellPrice',
        label: 'Sell Price ($)',
        type: 'number',
        defaultValue: 2870,
        min: 0.001,
      },
      {
        name: 'totalFeeRatePercent',
        label: 'Total Fee Rate (%)',
        type: 'number',
        defaultValue: 0.25,
        step: 0.01,
        unit: '%',
      },
    ],
  },
  {
    id: 'triangular-arbitrage',
    slug: 'triangular-arbitrage',
    category: 'arbitrage',
    name: 'Three-Leg (Triangular) Arbitrage',
    description:
      'Evaluates cyclical currency loops (e.g. BTC -> USDT -> ETH -> BTC) for riskless price imbalances.',
    formulaDescription: 'Net Return % = (R_AB * R_BC * R_CA * (1 - fee)^3 - 1) * 100',
    icon: 'RefreshCw',
    status: 'ACTIVE',
    parameters: [
      { name: 'pair1Rate', label: 'Pair 1 Rate (A -> B)', type: 'number', defaultValue: 68500 },
      { name: 'pair2Rate', label: 'Pair 2 Rate (B -> C)', type: 'number', defaultValue: 0.00035 },
      { name: 'pair3Rate', label: 'Pair 3 Rate (C -> A)', type: 'number', defaultValue: 0.042 },
      {
        name: 'feeRatePerLegPercent',
        label: 'Fee per Leg (%)',
        type: 'number',
        defaultValue: 0.075,
        step: 0.005,
        unit: '%',
      },
    ],
  },

  // 2. Exchange Fees Category
  {
    id: 'maker-taker-fee',
    slug: 'maker-taker-fee',
    category: 'fees',
    name: 'Maker vs Taker Fee Calculator',
    description:
      'Compares commission drag between passive order-book resting and aggressive market execution.',
    formulaDescription: 'Fee = Volume * Fee_Rate%',
    icon: 'Receipt',
    status: 'ACTIVE',
    parameters: [
      { name: 'tradeVolumeUsd', label: 'Trade Volume ($)', type: 'number', defaultValue: 10000 },
      {
        name: 'makerFeePercent',
        label: 'Maker Fee (%)',
        type: 'number',
        defaultValue: 0.02,
        step: 0.005,
        unit: '%',
      },
      {
        name: 'takerFeePercent',
        label: 'Taker Fee (%)',
        type: 'number',
        defaultValue: 0.05,
        step: 0.005,
        unit: '%',
      },
    ],
  },
  {
    id: 'volume-tier-fee',
    slug: 'volume-tier-fee',
    category: 'fees',
    name: 'Volume-Tier VIP Fee Calculator',
    description:
      'Determines fee bracket tier and savings achieved through 30-day institutional trading volume.',
    formulaDescription: 'Fee = Tier(Volume >= Threshold)',
    icon: 'Award',
    status: 'ACTIVE',
    parameters: [
      {
        name: 'thirtyDayVolumeUsd',
        label: '30-Day Rolling Volume ($)',
        type: 'number',
        defaultValue: 250000,
      },
    ],
  },

  // 3. Slippage & Market Impact
  {
    id: 'slippage',
    slug: 'slippage',
    category: 'slippage',
    name: 'Slippage & Depth Impact Calculator',
    description:
      'Simulates orderbook fills across $1k to $500k tranches and calculates VWAP slippage.',
    formulaDescription: 'VWAP = Sum(P_i * Q_i) / Sum(Q_i); Slippage = (|VWAP - Top| / Top) * 100',
    icon: 'Layers',
    status: 'ACTIVE',
    parameters: [
      {
        name: 'tradeSizeUsd',
        label: 'Trade Size ($)',
        type: 'number',
        defaultValue: 10000,
        min: 100,
      },
      {
        name: 'marketLiquidityDepthUsd',
        label: 'Available Book Depth ($)',
        type: 'number',
        defaultValue: 100000,
        min: 1000,
      },
      {
        name: 'baseVolatilityPercent',
        label: 'Asset Volatility (%)',
        type: 'number',
        defaultValue: 1.5,
        step: 0.1,
        unit: '%',
      },
    ],
  },

  // 4. Cross-Chain Arbitrage
  {
    id: 'cross-chain',
    slug: 'cross-chain',
    category: 'crosschain',
    name: 'Cross-Chain Arbitrage Calculator',
    description:
      'Calculates inter-chain price discrepancies factoring in bridge fees, duration, and dual gas.',
    formulaDescription: 'Net = (Amount * P_dst) - (Amount * P_src) - Bridge_Fees - Dual_Gas',
    icon: 'GitBranch',
    status: 'ACTIVE',
    supportedChains: ['Ethereum', 'Arbitrum', 'Base', 'Optimism', 'Solana', 'Polygon'],
    parameters: [
      {
        name: 'sourcePrice',
        label: 'Source Chain Price ($)',
        type: 'number',
        defaultValue: 2842.0,
      },
      { name: 'destPrice', label: 'Dest Chain Price ($)', type: 'number', defaultValue: 2874.0 },
      { name: 'tradeAmount', label: 'Token Quantity', type: 'number', defaultValue: 2.0 },
      {
        name: 'sourceGasUsd',
        label: 'Source Gas ($)',
        type: 'number',
        defaultValue: 1.8,
        unit: 'USD',
      },
      {
        name: 'bridgeFeeUsd',
        label: 'Bridge Fee ($)',
        type: 'number',
        defaultValue: 3.5,
        unit: 'USD',
      },
      {
        name: 'destGasUsd',
        label: 'Dest Gas ($)',
        type: 'number',
        defaultValue: 0.45,
        unit: 'USD',
      },
      {
        name: 'estimatedBridgeDurationSeconds',
        label: 'Bridge Time (sec)',
        type: 'number',
        defaultValue: 90,
        unit: 's',
        isAdvanced: true,
      },
    ],
  },

  // 5. Funding-Rate Arbitrage
  {
    id: 'funding-rate',
    slug: 'funding-rate',
    category: 'funding',
    name: 'Funding Rate & Delta-Neutral Carry',
    description:
      'Calculates delta-neutral yield, 8h payouts, and annual APR/APY from perpetual funding divergence.',
    formulaDescription:
      'Daily Payout = Position * FundingRate * 3; APY = ((1 + Rate)^Periods - 1) * 100',
    icon: 'Flame',
    status: 'ACTIVE',
    supportedExchanges: ['Binance', 'Bybit', 'OKX', 'Hyperliquid', 'Bitget'],
    parameters: [
      {
        name: 'positionSizeUsd',
        label: 'Position Size ($)',
        type: 'number',
        defaultValue: 10000,
        min: 100,
      },
      {
        name: 'fundingRatePercent',
        label: 'Funding Rate (% per 8h)',
        type: 'number',
        defaultValue: 0.015,
        step: 0.001,
        unit: '%',
      },
      {
        name: 'intervalHours',
        label: 'Interval Hours',
        type: 'number',
        defaultValue: 8,
        unit: 'h',
      },
      {
        name: 'holdingPeriods',
        label: 'Holding Intervals',
        type: 'number',
        defaultValue: 3,
        unit: 'intervals',
      },
      {
        name: 'roundTripFeePercent',
        label: 'Entry/Exit Fee (%)',
        type: 'number',
        defaultValue: 0.075,
        step: 0.01,
        unit: '%',
        isAdvanced: true,
      },
    ],
  },

  // 6. Futures & Margin
  {
    id: 'futures-liquidation',
    slug: 'futures-liquidation',
    category: 'futures',
    name: 'Futures Liquidation & PnL Calculator',
    description:
      'Calculates exact liquidation price, margin requirements, ROE, and PnL for long and short positions.',
    formulaDescription:
      'P_liq = P_entry * (1 - 1/Lev + MMR) for Long; P_liq = P_entry * (1 + 1/Lev - MMR) for Short',
    icon: 'AlertTriangle',
    status: 'ACTIVE',
    parameters: [
      { name: 'entryPrice', label: 'Entry Price ($)', type: 'number', defaultValue: 68500 },
      {
        name: 'leverage',
        label: 'Leverage (x)',
        type: 'number',
        defaultValue: 10,
        min: 1,
        max: 125,
      },
      {
        name: 'maintenanceMarginRatePercent',
        label: 'MMR (%)',
        type: 'number',
        defaultValue: 0.5,
        step: 0.1,
        unit: '%',
      },
      { name: 'isLong', label: 'Long Position?', type: 'boolean', defaultValue: true },
    ],
  },

  // 7. DeFi / DEX
  {
    id: 'impermanent-loss',
    slug: 'impermanent-loss',
    category: 'defi',
    name: 'Impermanent Loss & AMM Calculator',
    description:
      'Calculates LP divergence loss and break-even fee APY for constant-product automated market makers.',
    formulaDescription: 'IL % = (1 - (2 * sqrt(k)) / (1 + k)) * 100',
    icon: 'PieChart',
    status: 'ACTIVE',
    parameters: [
      {
        name: 'priceRatio',
        label: 'Price Change Ratio (P_after / P_before)',
        type: 'number',
        defaultValue: 1.25,
        step: 0.05,
      },
      {
        name: 'initialDepositUsd',
        label: 'Deposit Value ($)',
        type: 'number',
        defaultValue: 5000,
        isAdvanced: true,
      },
      {
        name: 'poolAprPercent',
        label: 'Pool Trading Fee APR (%)',
        type: 'number',
        defaultValue: 28.0,
        unit: '%',
        isAdvanced: true,
      },
    ],
  },

  // 8. Stablecoin Arbitrage
  {
    id: 'stablecoin-depeg',
    slug: 'stablecoin-depeg',
    category: 'stablecoin',
    name: 'Stablecoin Depeg & Redemption Calculator',
    description:
      'Identifies discount/premium deviations from $1.00 peg and net yields after redemption tariffs.',
    formulaDescription: 'Net = (Qty * 1.00) - (Qty * P_market) - Fees',
    icon: 'DollarSign',
    status: 'ACTIVE',
    parameters: [
      {
        name: 'marketPriceUsd',
        label: 'Market Price ($)',
        type: 'number',
        defaultValue: 0.992,
        step: 0.001,
      },
      {
        name: 'pegTargetPriceUsd',
        label: 'Target Peg ($)',
        type: 'number',
        defaultValue: 1.0,
        step: 0.001,
      },
      { name: 'tokenQuantity', label: 'Token Quantity', type: 'number', defaultValue: 10000 },
      {
        name: 'redemptionFeePercent',
        label: 'Redemption Fee (%)',
        type: 'number',
        defaultValue: 0.1,
        step: 0.01,
        unit: '%',
      },
    ],
  },

  // 9. Portfolio & Capital
  {
    id: 'capital-allocation',
    slug: 'capital-allocation',
    category: 'portfolio',
    name: 'Capital Allocation & Efficiency',
    description:
      'Optimizes capital sizing across active arbitrage corridors based on venue liquidity limits.',
    formulaDescription: 'Allocations ordered by marginal net spread up to venue capacity',
    icon: 'Sliders',
    status: 'ACTIVE',
    parameters: [
      {
        name: 'totalPortfolioCapitalUsd',
        label: 'Total Capital ($)',
        type: 'number',
        defaultValue: 50000,
      },
    ],
  },

  // 10. Risk & Volatility
  {
    id: 'var-risk',
    slug: 'var-risk',
    category: 'risk',
    name: 'Value at Risk (VaR) & Sharpe Calculator',
    description:
      'Calculates parametric VaR, historical drawdown, and risk-adjusted Sharpe/Sortino ratios.',
    formulaDescription: 'VaR = Position * (Z_alpha * sigma - mu)',
    icon: 'ShieldCheck',
    status: 'ACTIVE',
    parameters: [
      { name: 'positionSizeUsd', label: 'Position Size ($)', type: 'number', defaultValue: 25000 },
      {
        name: 'dailyVolatilityPercent',
        label: 'Daily Volatility (%)',
        type: 'number',
        defaultValue: 2.8,
        step: 0.1,
        unit: '%',
      },
      {
        name: 'confidenceLevel',
        label: 'Confidence Level',
        type: 'select',
        defaultValue: 0.95,
        options: [
          { label: '95%', value: 0.95 },
          { label: '99%', value: 0.99 },
        ],
      },
    ],
  },

  // 11. Yield & Staking
  {
    id: 'apr-apy-converter',
    slug: 'apr-apy-converter',
    category: 'yield',
    name: 'APR vs APY Compound Calculator',
    description:
      'Converts between simple annual rates (APR) and compounded annual yields (APY) across frequencies.',
    formulaDescription: 'APY = ((1 + APR/n)^n - 1) * 100',
    icon: 'Percent',
    status: 'ACTIVE',
    parameters: [
      {
        name: 'aprPercent',
        label: 'Simple APR (%)',
        type: 'number',
        defaultValue: 18.5,
        step: 0.1,
        unit: '%',
      },
      {
        name: 'compoundingFrequency',
        label: 'Compounding Frequency',
        type: 'select',
        defaultValue: 'DAILY',
        options: [
          { label: 'Daily (365x)', value: 'DAILY' },
          { label: 'Hourly (8,760x)', value: 'HOURLY' },
          { label: 'Weekly (52x)', value: 'WEEKLY' },
          { label: 'Monthly (12x)', value: 'MONTHLY' },
        ],
      },
    ],
  },

  // 12. Gas & Network
  {
    id: 'ethereum-l2-gas',
    slug: 'ethereum-l2-gas',
    category: 'gas',
    name: 'Ethereum & L2 Gas Cost Oracle',
    description:
      'Computes exact on-chain transaction expenses under EIP-1559 and L2 rollup batch publication.',
    formulaDescription: 'Cost = GasUnits * (BaseFee + PriorityFee) * 1e-9 * ETH_USD',
    icon: 'Fuel',
    status: 'ACTIVE',
    supportedChains: ['Ethereum', 'Arbitrum', 'Base', 'Optimism', 'Polygon'],
    parameters: [
      { name: 'gasLimitUnits', label: 'Gas Limit Units', type: 'number', defaultValue: 185000 },
      {
        name: 'baseFeeGwei',
        label: 'Base Fee (Gwei)',
        type: 'number',
        defaultValue: 15.0,
        step: 0.5,
      },
      {
        name: 'priorityFeeGwei',
        label: 'Priority Fee (Gwei)',
        type: 'number',
        defaultValue: 2.0,
        step: 0.1,
      },
      { name: 'ethPriceUsd', label: 'ETH Price ($)', type: 'number', defaultValue: 2850.0 },
    ],
  },

  // 13. Opportunity Scoring
  {
    id: 'opportunity-scoring',
    slug: 'opportunity-scoring',
    category: 'scoring',
    name: 'Multi-Factor Opportunity Scoring',
    description:
      'Deterministic quality, liquidity, and risk scoring engine rating arbitrage spreads from AAA to D.',
    formulaDescription: 'Score = 0.45*Profitability + 0.35*Liquidity - 0.35*Risk',
    icon: 'CheckCircle2',
    status: 'ACTIVE',
    parameters: [
      {
        name: 'netSpreadPercent',
        label: 'Net Spread (%)',
        type: 'number',
        defaultValue: 1.25,
        step: 0.05,
        unit: '%',
      },
      { name: 'netProfitUsd', label: 'Est. Net Profit ($)', type: 'number', defaultValue: 140.0 },
      {
        name: 'orderBookLiquidityUsd',
        label: 'Order Book Depth ($)',
        type: 'number',
        defaultValue: 45000,
      },
      {
        name: 'capitalRequirementUsd',
        label: 'Required Capital ($)',
        type: 'number',
        defaultValue: 5000,
      },
      {
        name: 'expectedSlippagePercent',
        label: 'Expected Slippage (%)',
        type: 'number',
        defaultValue: 0.08,
        step: 0.01,
        unit: '%',
      },
      {
        name: 'executionLatencyMs',
        label: 'Route Latency (ms)',
        type: 'number',
        defaultValue: 120,
        unit: 'ms',
      },
      {
        name: 'exchangeReliabilityScore',
        label: 'Venue Reliability (0-1)',
        type: 'number',
        defaultValue: 0.98,
        step: 0.01,
        isAdvanced: true,
      },
      {
        name: 'withdrawalAvailability',
        label: 'Withdrawal Active',
        type: 'boolean',
        defaultValue: true,
        isAdvanced: true,
      },
    ],
  },

  // 14. Interactive Simulator
  {
    id: 'opportunity-simulator',
    slug: 'opportunity-simulator',
    category: 'simulation',
    name: 'Trade Size vs Net Profit Simulator',
    description:
      'Generates comprehensive trade-size sweeps showing where market impact overtakes profit.',
    formulaDescription: 'Profit Curve = Size * Margin - k * Size^2 - FixedCosts',
    icon: 'Play',
    status: 'ACTIVE',
    parameters: [
      {
        name: 'capitalUsd',
        label: 'Total Capital Budget ($)',
        type: 'number',
        defaultValue: 50000,
      },
      {
        name: 'tradeSizeUsd',
        label: 'Current Trade Size ($)',
        type: 'number',
        defaultValue: 10000,
      },
      { name: 'buyPrice', label: 'Buy Price ($)', type: 'number', defaultValue: 2840.0 },
      { name: 'sellPrice', label: 'Sell Price ($)', type: 'number', defaultValue: 2872.0 },
      {
        name: 'tradingFeePercent',
        label: 'Trading Fee (%)',
        type: 'number',
        defaultValue: 0.075,
        step: 0.005,
        unit: '%',
      },
      { name: 'gasCostUsd', label: 'Fixed Gas Cost ($)', type: 'number', defaultValue: 2.5 },
      { name: 'withdrawalFeeUsd', label: 'Withdrawal Fee ($)', type: 'number', defaultValue: 1.0 },
    ],
  },
];
