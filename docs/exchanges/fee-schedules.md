# Exchange Fee Schedules & Cost Modeling

## 1. Fee Architecture

Net arbitrage profitability is fundamentally constrained by trading fees, withdrawal fees, and transfer costs. The `@arbitrage/market-data` and `@arbitrage/calculators` packages provide a unified `DefaultFeeProvider` that tracks VIP tiers, maker/taker rates, and asset withdrawal costs across all supported venues.

```
+-------------------------------------------------------------------------------+
|                             TOTAL COST BREAKDOWN                              |
+-------------------------------------------------------------------------------+
|  Total Cost = Leg 1 Trading Fee (Taker)                                       |
|             + Leg 2 Trading Fee (Maker or Taker)                              |
|             + Withdrawal Fee (Network transfer from Venue A -> Venue B)       |
|             + Deposit Network Gas Fee                                         |
|             + Funding Drag (if holding perp position across funding interval) |
+-------------------------------------------------------------------------------+
```

---

## 2. Standard Venue Fee Schedules (Base / VIP 0)

| Exchange        | Spot Maker (bps) | Spot Taker (bps) | Perp Maker (bps) | Perp Taker (bps) | Native Token Discount |
| :-------------- | :--------------- | :--------------- | :--------------- | :--------------- | :-------------------- |
| **Binance**     | 10.0             | 10.0             | 2.0              | 5.0              | 25% with BNB          |
| **Bybit**       | 10.0             | 20.0             | 2.0              | 5.5              | VIP tier discounts    |
| **OKX**         | 8.0              | 15.0             | 2.0              | 5.0              | OKB fee tier          |
| **Bitget**      | 10.0             | 20.0             | 2.0              | 6.0              | 20% with BGB          |
| **KuCoin**      | 10.0             | 20.0             | 2.0              | 6.0              | 20% with KCS          |
| **Gate**        | 15.0             | 20.0             | 1.5              | 5.0              | GT fee discount       |
| **MEXC**        | 0.0              | 10.0             | 0.0              | 1.0              | 50% with MX           |
| **Hyperliquid** | 1.0              | 3.5              | 1.0              | 3.5              | Volume-based          |

---

## 3. Dynamic Fee Resolution

`DefaultFeeProvider` resolves fees using a strict 4-level hierarchy:

```typescript
export type FeeSource = 'CONFIGURED' | 'LIVE' | 'ESTIMATED' | 'UNKNOWN';

export interface FeeSchedule {
  makerBps: number;
  takerBps: number;
  source: FeeSource;
  withdrawalFeeUsd?: number;
  vipTier?: number;
  discountTokenApplied?: boolean;
}
```

1. **LIVE**: Fetched dynamically via authenticated exchange account endpoints (if available).
2. **CONFIGURED**: Loaded from operator override files (`config/fees.json`).
3. **ESTIMATED**: Fallback based on published public baseline exchange tier.
4. **UNKNOWN**: When no schedule is available, conservative penalty fee is applied (default 25 bps taker).

---

## 4. Withdrawal Fee Reference Table (Sample Assets)

| Asset    | Network          | Typical Withdrawal Fee | Notes                        |
| :------- | :--------------- | :--------------------- | :--------------------------- |
| **USDT** | Tron (TRC20)     | $1.00 - $2.50          | High speed, fixed cost       |
| **USDT** | Arbitrum One     | $0.20 - $0.50          | Low L2 gas fee               |
| **USDC** | Solana           | $0.10 - $0.30          | Ultra-fast settlement        |
| **BTC**  | Bitcoin Native   | $2.00 - $15.00         | Mempool congestion dependent |
| **ETH**  | Ethereum Mainnet | $2.50 - $12.00         | Gas price dependent          |
| **SOL**  | Solana Native    | $0.05 - $0.15          | Sub-second finality          |
