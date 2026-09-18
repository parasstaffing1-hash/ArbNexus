export interface StoryMetric {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface StorySectionConfig {
  index: number;
  id: string;
  video: string;
  tag: string;
  title: string;
  highlightTitle?: string;
  subtitle: string;
  metrics?: StoryMetric[];
  overlayType:
    | 'hero'
    | 'scanner'
    | 'cross-exchange'
    | 'triangular'
    | 'cross-chain'
    | 'funding'
    | 'liquidity'
    | 'engine'
    | 'backtesting'
    | 'network';
  primaryCta?: {
    label: string;
    targetView: string;
  };
  secondaryCta?: {
    label: string;
    targetView: string;
  };
}

export const STORY_SECTIONS: StorySectionConfig[] = [
  {
    index: 1,
    id: 'hero',
    video: '/videos/1.mp4',
    tag: '01 / BRAND IDENTITY',
    title: 'ARBNEXUS',
    highlightTitle: 'The Intelligence Platform for Crypto Arbitrage',
    subtitle:
      'Discover, analyze and simulate opportunities across crypto markets. Built for high-frequency algorithmic intelligence, real-time depth models, and zero-float deterministic precision.',
    overlayType: 'hero',
    primaryCta: {
      label: 'Explore Arbitrage',
      targetView: 'dashboard',
    },
    secondaryCta: {
      label: 'View Live Scanner',
      targetView: 'scanner',
    },
    metrics: [
      { label: 'SUPPORTED VENUES', value: '45+' },
      { label: 'MEDIAN LATENCY', value: '16ms', positive: true },
      { label: 'ACTIVE STRATEGIES', value: '14' },
      { label: 'EXECUTION MATH', value: 'Decimal.js' },
    ],
  },
  {
    index: 2,
    id: 'scanner',
    video: '/videos/2.mp4',
    tag: '02 / REAL-TIME DETECTION',
    title: 'Live Arbitrage Scanner',
    highlightTitle: 'Sub-Millisecond Multi-Venue Discovery',
    subtitle:
      'Monitor price differences across centralized and decentralized venues in real time. Continuously parses Level-2 order books, tick-by-tick trades, and funding anomalies with microsecond resolution.',
    overlayType: 'scanner',
    primaryCta: {
      label: 'Open Scanner',
      targetView: 'scanner',
    },
    metrics: [
      { label: 'ACTIVE OPPORTUNITIES', value: '1,428' },
      { label: 'AVG NET SPREAD', value: '+42.5 bps', positive: true },
      { label: 'MAX PROFIT (1H)', value: '$14,820' },
      { label: 'EXECUTABLE SIZE', value: '$250,000' },
    ],
  },
  {
    index: 3,
    id: 'cross-exchange',
    video: '/videos/3.mp4',
    tag: '03 / CEX ↔ CEX ARBITRAGE',
    title: 'Cross-Exchange Arbitrage',
    highlightTitle: 'Verified Executable Spreads After All Fees',
    subtitle:
      'Compare executable prices across crypto exchanges and identify opportunities after fees and slippage. Every simulated trade factors in dynamic VIP maker/taker tiers, withdrawal costs, and order-book depth walks.',
    overlayType: 'cross-exchange',
    primaryCta: {
      label: 'Inspect CEX Pairs',
      targetView: 'scanner',
    },
    metrics: [
      { label: 'BUY VENUE', value: 'Binance (Ask $100,010)' },
      { label: 'SELL VENUE', value: 'OKX (Bid $100,480)' },
      { label: 'GROSS SPREAD', value: '+47.0 bps' },
      { label: 'NET PROFIT', value: '+$1,175.00', positive: true },
    ],
  },
  {
    index: 4,
    id: 'triangular',
    video: '/videos/4.mp4',
    tag: '04 / MULTI-HOP CYCLES',
    title: 'Triangular & Multi-Hop Arbitrage',
    highlightTitle: 'Negative Cycle Discovery Across Single Venues',
    subtitle:
      'Discover profitable conversion cycles across multiple assets and markets using vectorized Bellman-Ford algorithms. Zero counterparty bridge risk, executed atomically within single exchange order books.',
    overlayType: 'triangular',
    primaryCta: {
      label: 'Simulate Cycles',
      targetView: 'calculators',
    },
    metrics: [
      { label: 'CYCLE ROUTE', value: 'USDT → BTC → ETH → USDT' },
      { label: 'HOP EFFICIENCY', value: '99.88%' },
      { label: 'CYCLE DURATION', value: '< 25ms' },
      { label: 'EST. NET MARGIN', value: '+18.4 bps', positive: true },
    ],
  },
  {
    index: 5,
    id: 'cross-chain',
    video: '/videos/5.mp4',
    tag: '05 / ON-CHAIN NETWORKS',
    title: 'Cross-Chain Arbitrage',
    highlightTitle: 'Universal Bridge & Swap Routing',
    subtitle:
      'Compare liquidity and executable prices across chains and routes. Real-time gas tracking across Ethereum, Base, Arbitrum, and Solana with automated slippage and bridge finality risk assessment.',
    overlayType: 'cross-chain',
    primaryCta: {
      label: 'Explore Cross-Chain',
      targetView: 'cross-chain',
    },
    metrics: [
      { label: 'SOURCE CHAIN', value: 'Ethereum Mainnet' },
      { label: 'DESTINATION', value: 'Solana / Arbitrum' },
      { label: 'AVG GAS COST', value: '$0.42 (L2)' },
      { label: 'NET MARGIN', value: '+84.2 bps', positive: true },
    ],
  },
  {
    index: 6,
    id: 'funding',
    video: '/videos/6.mp4',
    tag: '06 / DERIVATIVES & BASIS',
    title: 'Funding & Basis Opportunities',
    highlightTitle: 'Delta-Neutral Yield Across Perpetual Venues',
    subtitle:
      'Monitor perpetual funding, futures basis and cross-venue derivatives relationships. Harvest annualized yield by simultaneously holding long and short positions across divergent funding regimes.',
    overlayType: 'funding',
    primaryCta: {
      label: 'View Funding Heatmap',
      targetView: 'funding',
    },
    metrics: [
      { label: 'TOP SPREAD PAIR', value: 'SOL-PERP' },
      { label: 'LONG / SHORT VENUE', value: 'Hyperliquid / Bybit' },
      { label: 'ANNUALIZED APY', value: '44.8%', positive: true },
      { label: 'BASIS SPREAD', value: '+32.0 bps' },
    ],
  },
  {
    index: 7,
    id: 'liquidity',
    video: '/videos/7.mp4',
    tag: '07 / EXECUTION REALITY',
    title: 'Trade What Is Actually Executable',
    highlightTitle: 'Order-Book Depth, Slippage & Market Impact',
    subtitle:
      'A price difference is not necessarily an executable arbitrage. ArbNexus models true order-book depth walks, weighted average execution price, and nonlinear market impact for institutional capital.',
    overlayType: 'liquidity',
    primaryCta: {
      label: 'Depth Calculator',
      targetView: 'calculators',
    },
    metrics: [
      { label: 'ORDER SIZE $1K', value: '+42.5 bps (Net $4.25)', positive: true },
      { label: 'ORDER SIZE $10K', value: '+38.2 bps (Net $38.20)', positive: true },
      { label: 'ORDER SIZE $100K', value: '+21.0 bps (Net $210.00)', positive: true },
      { label: 'ORDER SIZE $500K', value: '-12.4 bps (Break-Even Reached)', positive: false },
    ],
  },
  {
    index: 8,
    id: 'engine',
    video: '/videos/8.mp4',
    tag: '08 / INTELLIGENCE ENGINE',
    title: 'From Millions of Data Points to Real Opportunities',
    highlightTitle: 'Multi-Stage Algorithmic Risk Filtering',
    subtitle:
      'ArbNexus continuously filters raw market data through fees, liquidity, slippage, network latency, gas spikes, transfer costs, and venue counterparty risk to ensure only high-confidence trades surface.',
    overlayType: 'engine',
    primaryCta: {
      label: 'Explore Opportunity Filter',
      targetView: 'dashboard',
    },
    metrics: [
      { label: 'TICKS PROCESSED / SEC', value: '850,000+' },
      { label: 'STALE DISCARD RATE', value: '99.4%' },
      { label: 'CONFIDENCE THRESHOLD', value: '≥ 85 / 100' },
      { label: 'FILTER CRITERIA', value: '7 Active Layers' },
    ],
  },
  {
    index: 9,
    id: 'backtesting',
    video: '/videos/9.mp4',
    tag: '09 / QUANTITATIVE RESEARCH',
    title: 'Research Before You Risk Capital',
    highlightTitle: 'Historical Tick Replay & Vectorized Backtesting',
    subtitle:
      'Replay historical market conditions, stress-test strategy parameters, and analyze how arbitrage opportunities behaved over high-volatility regimes with zero simulation slippage distortion.',
    overlayType: 'backtesting',
    primaryCta: {
      label: 'Open Research',
      targetView: 'backtesting',
    },
    secondaryCta: {
      label: 'Paper Trading',
      targetView: 'paper-trading',
    },
    metrics: [
      { label: 'REPLAY PRECISION', value: 'Tick & L2 OrderBook' },
      { label: 'HISTORICAL LAKE', value: 'Hive-Partitioned Parquet' },
      { label: 'SIMULATED SHARPE', value: '3.82', positive: true },
      { label: 'MAX DRAWDOWN', value: '-0.84%' },
    ],
  },
  {
    index: 10,
    id: 'network',
    video: '/videos/10.mp4',
    tag: '10 / MASTER ARBNEXUS NETWORK',
    title: 'One Intelligence Layer for Crypto Arbitrage',
    highlightTitle: 'The Complete Arbitrage Intelligence Stack',
    subtitle:
      'Connect exchanges, decentralized protocols, cross-chain bridges, perpetual derivatives, deep liquidity books, and historical analytics through a single unified institutional platform.',
    overlayType: 'network',
    primaryCta: {
      label: 'Enter ArbNexus',
      targetView: 'dashboard',
    },
    secondaryCta: {
      label: 'Explore the Terminal',
      targetView: 'scanner',
    },
    metrics: [
      { label: 'INTELLIGENCE SUITE', value: '14 Detectors Active' },
      { label: 'CALCULATORS', value: '100+ Deterministic' },
      { label: 'DATA BUS', value: 'NATS JetStream' },
      { label: 'STATUS', value: 'PRODUCTION READY', positive: true },
    ],
  },
];
