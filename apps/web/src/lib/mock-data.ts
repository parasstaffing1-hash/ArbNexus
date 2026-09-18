export interface LiveOpportunity {
  id: string;
  token: string;
  pair: string;
  sourceExchange: string;
  sourceExchangeType: 'CEX' | 'DEX';
  targetExchange: string;
  targetExchangeType: 'CEX' | 'DEX';
  network: string;
  buyPrice: number;
  sellPrice: number;
  grossSpreadPercent: number;
  netSpreadPercent: number;
  estimatedFeesUsd: number;
  netProfitUsd: number;
  minCapitalUsd: number;
  confidenceScore: number;
  executionDurationMs: number;
  strategy:
    | 'DEX_CEX'
    | 'SPATIAL'
    | 'CROSS_CHAIN'
    | 'TRIANGULAR'
    | 'DEX_DEX'
    | 'ONCHAIN_MEV'
    | 'STABLECOIN'
    | string;
  status: 'ACTIVE' | 'SIMULATING' | 'EXECUTING' | 'STALE';
  detectedAt: number;
  protocol?: string;
  poolId?: string;
  sourceChain?: string;
  destChain?: string;
  bridge?: string;
  gasCostUsd?: number;
  bridgeCostUsd?: number;
  swapFeeUsd?: number;
  priceImpactPercent?: number;
  blockNumber?: number;
  executableSizeUsd?: number;
  liquidityUsd?: string;
  simulationStatus?: string;
}

export interface LiveTicker {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  sparkline: number[];
}

export interface FundingRateData {
  asset: string;
  binance: number;
  bybit: number;
  okx: number;
  hyperliquid: number;
  bitget: number;
  predictedNext: number;
  annualizedApy: number;
}

export interface BridgeRoute {
  id: string;
  name: string;
  sourceChain: string;
  destChain: string;
  estimatedFeeUsd: number;
  gasCostUsd: number;
  durationMinutes: number;
  securityScore: number;
  liquidityUsd: string;
  hops: string[];
}

export interface ExchangeStatus {
  id: string;
  name: string;
  type: 'CEX' | 'DEX';
  status: 'online' | 'degraded' | 'offline';
  latencyMs: number;
  monitoredPairs: number;
  uptime24h: number;
  orderbookDepthMs: number;
  endpoint: string;
}

export interface GasMetric {
  chain: string;
  slowGwei: number;
  standardGwei: number;
  fastGwei: number;
  usdEquivalent: number;
}

export interface AlertRule {
  id: string;
  name: string;
  triggerType: 'SPREAD' | 'FUNDING' | 'LIQUIDITY';
  threshold: number;
  channels: ('TELEGRAM' | 'DISCORD' | 'EMAIL')[];
  isActive: boolean;
  lastTriggered?: string;
}

// 1. Mock Arbitrage Opportunities (15 items)
export const MOCK_OPPORTUNITIES: LiveOpportunity[] = [
  {
    id: 'opp-1',
    token: 'ETH',
    pair: 'ETH/USDT',
    sourceExchange: 'Uniswap V3',
    sourceExchangeType: 'DEX',
    targetExchange: 'Binance',
    targetExchangeType: 'CEX',
    network: 'Ethereum',
    buyPrice: 2842.2,
    sellPrice: 2873.8,
    grossSpreadPercent: 1.11,
    netSpreadPercent: 0.89,
    estimatedFeesUsd: 22.4,
    netProfitUsd: 142.8,
    minCapitalUsd: 5000,
    confidenceScore: 0.96,
    executionDurationMs: 420,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 2500,
  },
  {
    id: 'opp-2',
    token: 'SOL',
    pair: 'SOL/USDC',
    sourceExchange: 'Raydium',
    sourceExchangeType: 'DEX',
    targetExchange: 'Bybit',
    targetExchangeType: 'CEX',
    network: 'Solana',
    buyPrice: 178.15,
    sellPrice: 181.4,
    grossSpreadPercent: 1.82,
    netSpreadPercent: 1.58,
    estimatedFeesUsd: 4.8,
    netProfitUsd: 215.2,
    minCapitalUsd: 3500,
    confidenceScore: 0.94,
    executionDurationMs: 180,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 5400,
  },
  {
    id: 'opp-3',
    token: 'BTC',
    pair: 'BTC/USDT',
    sourceExchange: 'OKX',
    sourceExchangeType: 'CEX',
    targetExchange: 'Hyperliquid',
    targetExchangeType: 'DEX',
    network: 'Arbitrum',
    buyPrice: 68450.0,
    sellPrice: 68890.0,
    grossSpreadPercent: 0.64,
    netSpreadPercent: 0.52,
    estimatedFeesUsd: 38.5,
    netProfitUsd: 310.0,
    minCapitalUsd: 10000,
    confidenceScore: 0.98,
    executionDurationMs: 95,
    strategy: 'SPATIAL',
    status: 'ACTIVE',
    detectedAt: Date.now() - 1100,
  },
  {
    id: 'opp-4',
    token: 'ARB',
    pair: 'ARB/USDT',
    sourceExchange: 'Camelot',
    sourceExchangeType: 'DEX',
    targetExchange: 'Binance',
    targetExchangeType: 'CEX',
    network: 'Arbitrum',
    buyPrice: 0.884,
    sellPrice: 0.902,
    grossSpreadPercent: 2.03,
    netSpreadPercent: 1.76,
    estimatedFeesUsd: 6.2,
    netProfitUsd: 78.4,
    minCapitalUsd: 2000,
    confidenceScore: 0.91,
    executionDurationMs: 250,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 8900,
  },
  {
    id: 'opp-5',
    token: 'SUI',
    pair: 'SUI/USDC',
    sourceExchange: 'Cetus',
    sourceExchangeType: 'DEX',
    targetExchange: 'OKX',
    targetExchangeType: 'CEX',
    network: 'Sui',
    buyPrice: 3.12,
    sellPrice: 3.19,
    grossSpreadPercent: 2.24,
    netSpreadPercent: 1.95,
    estimatedFeesUsd: 3.5,
    netProfitUsd: 94.2,
    minCapitalUsd: 1500,
    confidenceScore: 0.89,
    executionDurationMs: 140,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 12000,
  },
  {
    id: 'opp-6',
    token: 'AVAX',
    pair: 'AVAX/USDT',
    sourceExchange: 'TraderJoe',
    sourceExchangeType: 'DEX',
    targetExchange: 'Coinbase',
    targetExchangeType: 'CEX',
    network: 'Avalanche',
    buyPrice: 31.4,
    sellPrice: 32.1,
    grossSpreadPercent: 2.22,
    netSpreadPercent: 1.84,
    estimatedFeesUsd: 9.1,
    netProfitUsd: 112.5,
    minCapitalUsd: 3000,
    confidenceScore: 0.92,
    executionDurationMs: 310,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 3400,
  },
  {
    id: 'opp-7',
    token: 'OP',
    pair: 'OP/USDC',
    sourceExchange: 'Velodrome',
    sourceExchangeType: 'DEX',
    targetExchange: 'Bybit',
    targetExchangeType: 'CEX',
    network: 'Optimism',
    buyPrice: 1.85,
    sellPrice: 1.89,
    grossSpreadPercent: 2.16,
    netSpreadPercent: 1.78,
    estimatedFeesUsd: 5.4,
    netProfitUsd: 65.0,
    minCapitalUsd: 2500,
    confidenceScore: 0.88,
    executionDurationMs: 290,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 15000,
  },
  {
    id: 'opp-8',
    token: 'LINK',
    pair: 'LINK/USDT',
    sourceExchange: 'Uniswap V3',
    sourceExchangeType: 'DEX',
    targetExchange: 'Kraken',
    targetExchangeType: 'CEX',
    network: 'Ethereum',
    buyPrice: 18.25,
    sellPrice: 18.58,
    grossSpreadPercent: 1.8,
    netSpreadPercent: 1.42,
    estimatedFeesUsd: 14.2,
    netProfitUsd: 128.0,
    minCapitalUsd: 4000,
    confidenceScore: 0.93,
    executionDurationMs: 440,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 7200,
  },
  {
    id: 'opp-9',
    token: 'NEAR',
    pair: 'NEAR/USDT',
    sourceExchange: 'Ref Finance',
    sourceExchangeType: 'DEX',
    targetExchange: 'Binance',
    targetExchangeType: 'CEX',
    network: 'Near',
    buyPrice: 6.45,
    sellPrice: 6.58,
    grossSpreadPercent: 2.01,
    netSpreadPercent: 1.68,
    estimatedFeesUsd: 4.1,
    netProfitUsd: 82.4,
    minCapitalUsd: 2000,
    confidenceScore: 0.9,
    executionDurationMs: 210,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 9800,
  },
  {
    id: 'opp-10',
    token: 'DOGE',
    pair: 'DOGE/USDT',
    sourceExchange: 'Bybit',
    sourceExchangeType: 'CEX',
    targetExchange: 'OKX',
    targetExchangeType: 'CEX',
    network: 'Base',
    buyPrice: 0.241,
    sellPrice: 0.244,
    grossSpreadPercent: 1.24,
    netSpreadPercent: 0.98,
    estimatedFeesUsd: 5.8,
    netProfitUsd: 48.0,
    minCapitalUsd: 2500,
    confidenceScore: 0.95,
    executionDurationMs: 85,
    strategy: 'SPATIAL',
    status: 'ACTIVE',
    detectedAt: Date.now() - 4100,
  },
  {
    id: 'opp-11',
    token: 'ETH',
    pair: 'ETH/USDC',
    sourceExchange: 'Arbitrum (Camelot)',
    sourceExchangeType: 'DEX',
    targetExchange: 'Base (Aerodrome)',
    targetExchangeType: 'DEX',
    network: 'Cross-Chain',
    buyPrice: 2843.5,
    sellPrice: 2881.0,
    grossSpreadPercent: 1.31,
    netSpreadPercent: 0.95,
    estimatedFeesUsd: 18.5,
    netProfitUsd: 162.0,
    minCapitalUsd: 6000,
    confidenceScore: 0.91,
    executionDurationMs: 850,
    strategy: 'CROSS_CHAIN',
    status: 'ACTIVE',
    detectedAt: Date.now() - 14000,
  },
  {
    id: 'opp-12',
    token: 'SOL',
    pair: 'SOL/USDT',
    sourceExchange: 'Jupiter',
    sourceExchangeType: 'DEX',
    targetExchange: 'Coinbase',
    targetExchangeType: 'CEX',
    network: 'Solana',
    buyPrice: 178.6,
    sellPrice: 181.9,
    grossSpreadPercent: 1.84,
    netSpreadPercent: 1.54,
    estimatedFeesUsd: 6.5,
    netProfitUsd: 198.0,
    minCapitalUsd: 4000,
    confidenceScore: 0.94,
    executionDurationMs: 160,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 2100,
  },
  {
    id: 'opp-13',
    token: 'PEPE',
    pair: 'PEPE/USDT',
    sourceExchange: 'Uniswap V3',
    sourceExchangeType: 'DEX',
    targetExchange: 'Binance',
    targetExchangeType: 'CEX',
    network: 'Ethereum',
    buyPrice: 0.0000185,
    sellPrice: 0.0000192,
    grossSpreadPercent: 3.78,
    netSpreadPercent: 2.94,
    estimatedFeesUsd: 26.0,
    netProfitUsd: 220.0,
    minCapitalUsd: 3000,
    confidenceScore: 0.85,
    executionDurationMs: 480,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 6700,
  },
  {
    id: 'opp-14',
    token: 'AAVE',
    pair: 'AAVE/USDT',
    sourceExchange: 'Kraken',
    sourceExchangeType: 'CEX',
    targetExchange: 'Hyperliquid',
    targetExchangeType: 'DEX',
    network: 'Arbitrum',
    buyPrice: 192.4,
    sellPrice: 195.8,
    grossSpreadPercent: 1.76,
    netSpreadPercent: 1.44,
    estimatedFeesUsd: 9.8,
    netProfitUsd: 86.4,
    minCapitalUsd: 3500,
    confidenceScore: 0.92,
    executionDurationMs: 110,
    strategy: 'SPATIAL',
    status: 'ACTIVE',
    detectedAt: Date.now() - 19000,
  },
  {
    id: 'opp-15',
    token: 'UNI',
    pair: 'UNI/USDT',
    sourceExchange: 'Uniswap V3',
    sourceExchangeType: 'DEX',
    targetExchange: 'Bybit',
    targetExchangeType: 'CEX',
    network: 'Ethereum',
    buyPrice: 11.15,
    sellPrice: 11.38,
    grossSpreadPercent: 2.06,
    netSpreadPercent: 1.62,
    estimatedFeesUsd: 16.5,
    netProfitUsd: 104.0,
    minCapitalUsd: 3500,
    confidenceScore: 0.89,
    executionDurationMs: 410,
    strategy: 'DEX_CEX',
    status: 'ACTIVE',
    detectedAt: Date.now() - 8300,
  },
];

// 2. Mock Live Tickers
export const MOCK_TICKERS: Record<string, LiveTicker> = {
  'BTC/USDT': {
    symbol: 'BTC/USDT',
    price: 68620.5,
    change24h: 3.42,
    high24h: 69400.0,
    low24h: 66250.0,
    volume24h: '$34.8B',
    sparkline: [66250, 66800, 67100, 66900, 67400, 68100, 68620.5],
  },
  'ETH/USDT': {
    symbol: 'ETH/USDT',
    price: 2854.8,
    change24h: 4.18,
    high24h: 2890.0,
    low24h: 2715.0,
    volume24h: '$18.4B',
    sparkline: [2715, 2740, 2780, 2760, 2810, 2835, 2854.8],
  },
  'SOL/USDT': {
    symbol: 'SOL/USDT',
    price: 179.85,
    change24h: 6.74,
    high24h: 183.2,
    low24h: 166.4,
    volume24h: '$9.2B',
    sparkline: [166.4, 169.0, 172.5, 171.0, 175.2, 178.0, 179.85],
  },
};

// 3. Mock Funding Rates Heatmap
export const MOCK_FUNDING_RATES: FundingRateData[] = [
  {
    asset: 'BTC',
    binance: 0.012,
    bybit: 0.015,
    okx: 0.011,
    hyperliquid: 0.008,
    bitget: 0.014,
    predictedNext: 0.013,
    annualizedApy: 14.2,
  },
  {
    asset: 'ETH',
    binance: 0.018,
    bybit: 0.021,
    okx: 0.016,
    hyperliquid: 0.012,
    bitget: 0.019,
    predictedNext: 0.019,
    annualizedApy: 19.8,
  },
  {
    asset: 'SOL',
    binance: 0.034,
    bybit: 0.038,
    okx: 0.029,
    hyperliquid: 0.024,
    bitget: 0.035,
    predictedNext: 0.032,
    annualizedApy: 38.5,
  },
  {
    asset: 'AVAX',
    binance: 0.022,
    bybit: 0.025,
    okx: 0.019,
    hyperliquid: 0.015,
    bitget: 0.024,
    predictedNext: 0.021,
    annualizedApy: 24.1,
  },
  {
    asset: 'ARB',
    binance: -0.005,
    bybit: -0.002,
    okx: -0.008,
    hyperliquid: -0.012,
    bitget: -0.004,
    predictedNext: -0.006,
    annualizedApy: -6.5,
  },
  {
    asset: 'OP',
    binance: 0.008,
    bybit: 0.012,
    okx: 0.006,
    hyperliquid: 0.004,
    bitget: 0.009,
    predictedNext: 0.008,
    annualizedApy: 8.7,
  },
  {
    asset: 'SUI',
    binance: 0.045,
    bybit: 0.052,
    okx: 0.041,
    hyperliquid: 0.035,
    bitget: 0.048,
    predictedNext: 0.044,
    annualizedApy: 52.3,
  },
  {
    asset: 'LINK',
    binance: 0.014,
    bybit: 0.017,
    okx: 0.012,
    hyperliquid: 0.009,
    bitget: 0.015,
    predictedNext: 0.014,
    annualizedApy: 15.6,
  },
  {
    asset: 'DOGE',
    binance: 0.028,
    bybit: 0.031,
    okx: 0.025,
    hyperliquid: 0.021,
    bitget: 0.029,
    predictedNext: 0.027,
    annualizedApy: 31.2,
  },
  {
    asset: 'NEAR',
    binance: 0.019,
    bybit: 0.022,
    okx: 0.017,
    hyperliquid: 0.013,
    bitget: 0.02,
    predictedNext: 0.018,
    annualizedApy: 20.4,
  },
];

// 4. Mock Cross-Chain Bridges
export const MOCK_BRIDGES: BridgeRoute[] = [
  {
    id: 'stargate-1',
    name: 'Stargate V2 (LayerZero)',
    sourceChain: 'Ethereum',
    destChain: 'Arbitrum',
    estimatedFeeUsd: 4.5,
    gasCostUsd: 3.2,
    durationMinutes: 1.5,
    securityScore: 0.98,
    liquidityUsd: '$124M',
    hops: ['USDC Pool', 'LayerZero Endpoint', 'Instant Mint'],
  },
  {
    id: 'across-1',
    name: 'Across Protocol',
    sourceChain: 'Ethereum',
    destChain: 'Base',
    estimatedFeeUsd: 2.8,
    gasCostUsd: 2.1,
    durationMinutes: 2.0,
    securityScore: 0.96,
    liquidityUsd: '$88M',
    hops: ['SpokePool', 'Relayer Fill', 'Settlement'],
  },
  {
    id: 'lifi-1',
    name: 'LI.FI Diamond Route',
    sourceChain: 'Arbitrum',
    destChain: 'Optimism',
    estimatedFeeUsd: 1.9,
    gasCostUsd: 0.45,
    durationMinutes: 1.2,
    securityScore: 0.95,
    liquidityUsd: '$65M',
    hops: ['DEX Aggregator', 'CBridge', 'Destination Swap'],
  },
  {
    id: 'cbridge-1',
    name: 'Celer cBridge',
    sourceChain: 'Ethereum',
    destChain: 'Polygon',
    estimatedFeeUsd: 5.2,
    gasCostUsd: 4.8,
    durationMinutes: 4.5,
    securityScore: 0.93,
    liquidityUsd: '$42M',
    hops: ['Pegged Mint', 'SGN Validator', 'Release'],
  },
];

// 5. Mock Exchange Statuses
export const MOCK_EXCHANGES: ExchangeStatus[] = [
  {
    id: 'binance',
    name: 'Binance',
    type: 'CEX',
    status: 'online',
    latencyMs: 18,
    monitoredPairs: 412,
    uptime24h: 99.98,
    orderbookDepthMs: 25,
    endpoint: 'wss://stream.binance.com',
  },
  {
    id: 'bybit',
    name: 'Bybit',
    type: 'CEX',
    status: 'online',
    latencyMs: 24,
    monitoredPairs: 285,
    uptime24h: 99.95,
    orderbookDepthMs: 30,
    endpoint: 'wss://stream.bybit.com/v5/public',
  },
  {
    id: 'okx',
    name: 'OKX',
    type: 'CEX',
    status: 'online',
    latencyMs: 21,
    monitoredPairs: 340,
    uptime24h: 99.92,
    orderbookDepthMs: 28,
    endpoint: 'wss://ws.okx.com:8443',
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    type: 'DEX',
    status: 'online',
    latencyMs: 35,
    monitoredPairs: 165,
    uptime24h: 99.99,
    orderbookDepthMs: 15,
    endpoint: 'wss://api.hyperliquid.xyz',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    type: 'CEX',
    status: 'online',
    latencyMs: 38,
    monitoredPairs: 198,
    uptime24h: 99.89,
    orderbookDepthMs: 45,
    endpoint: 'wss://ws-feed.exchange.coinbase.com',
  },
  {
    id: 'kraken',
    name: 'Kraken',
    type: 'CEX',
    status: 'online',
    latencyMs: 42,
    monitoredPairs: 210,
    uptime24h: 99.85,
    orderbookDepthMs: 50,
    endpoint: 'wss://ws.kraken.com',
  },
  {
    id: 'uniswap-v3',
    name: 'Uniswap V3',
    type: 'DEX',
    status: 'online',
    latencyMs: 65,
    monitoredPairs: 580,
    uptime24h: 100.0,
    orderbookDepthMs: 120,
    endpoint: 'https://eth.llamarpc.com',
  },
  {
    id: 'raydium',
    name: 'Raydium',
    type: 'DEX',
    status: 'online',
    latencyMs: 28,
    monitoredPairs: 420,
    uptime24h: 99.94,
    orderbookDepthMs: 40,
    endpoint: 'https://api.mainnet-beta.solana.com',
  },
  {
    id: 'jupiter',
    name: 'Jupiter API',
    type: 'DEX',
    status: 'online',
    latencyMs: 32,
    monitoredPairs: 890,
    uptime24h: 99.91,
    orderbookDepthMs: 35,
    endpoint: 'https://quote-api.jup.ag',
  },
  {
    id: 'oneinch',
    name: '1inch Fusion+',
    type: 'DEX',
    status: 'online',
    latencyMs: 54,
    monitoredPairs: 650,
    uptime24h: 99.96,
    orderbookDepthMs: 80,
    endpoint: 'https://api.1inch.dev',
  },
];

// 6. Mock Gas Metrics
export const MOCK_GAS: GasMetric[] = [
  { chain: 'Ethereum', slowGwei: 12, standardGwei: 15, fastGwei: 19, usdEquivalent: 1.45 },
  { chain: 'Arbitrum', slowGwei: 0.05, standardGwei: 0.1, fastGwei: 0.15, usdEquivalent: 0.02 },
  { chain: 'Base', slowGwei: 0.02, standardGwei: 0.04, fastGwei: 0.08, usdEquivalent: 0.01 },
  { chain: 'Polygon', slowGwei: 28, standardGwei: 35, fastGwei: 48, usdEquivalent: 0.03 },
  {
    chain: 'Solana (TPS: 2,840)',
    slowGwei: 1000,
    standardGwei: 5000,
    fastGwei: 25000,
    usdEquivalent: 0.004,
  },
];

// 7. Mock Alert Rules
export const MOCK_ALERT_RULES: AlertRule[] = [
  {
    id: 'alert-1',
    name: 'High Spread Alert (> 1.5%)',
    triggerType: 'SPREAD',
    threshold: 1.5,
    channels: ['TELEGRAM', 'DISCORD'],
    isActive: true,
    lastTriggered: '12m ago',
  },
  {
    id: 'alert-2',
    name: 'Extreme Funding Anomaly (> 0.04%)',
    triggerType: 'FUNDING',
    threshold: 0.04,
    channels: ['TELEGRAM'],
    isActive: true,
    lastTriggered: '1h ago',
  },
  {
    id: 'alert-3',
    name: 'Major DEX/CEX Gap (> 2.0%)',
    triggerType: 'SPREAD',
    threshold: 2.0,
    channels: ['TELEGRAM', 'DISCORD', 'EMAIL'],
    isActive: false,
    lastTriggered: 'Yesterday',
  },
];
