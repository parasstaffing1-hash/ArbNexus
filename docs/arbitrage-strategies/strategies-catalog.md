# ArbNexus Arbitrage Strategies Catalog

ArbNexus models and monitors 14 distinct crypto arbitrage strategy classes. Each strategy is evaluated with strict deterministic financial math (`Decimal.js`) including venue fees, depth-weighted slippage, gas/bridge costs, and latency drag.

---

## Strategy Classification Matrix

| #      | Strategy Key   | Type           | Venues                    | Holding Time       | Primary Risk Factor                      |
| :----- | :------------- | :------------- | :------------------------ | :----------------- | :--------------------------------------- |
| **1**  | `SPOT_CEX_CEX` | Spatial        | CEX ↔ CEX                 | Seconds / Atomic   | Execution latency / Leg separation       |
| **2**  | `SPOT_CEX_DEX` | Hybrid         | CEX ↔ DEX                 | 1–2 Blocks (12s)   | Blockchain confirmation / MEV frontrun   |
| **3**  | `SPOT_DEX_DEX` | On-Chain       | DEX ↔ DEX                 | Atomic (Single Tx) | Transaction revert / Gas spike           |
| **4**  | `TRIANGULAR`   | Intra-Venue    | Single CEX/DEX            | Instantaneous      | Orderbook depth exhaustion               |
| **5**  | `MULTI_HOP`    | Graph Path     | Multi-Pair                | Seconds            | Cumulative fee drag / Route collapse     |
| **6**  | `CROSS_CHAIN`  | Bridge Spread  | Chain A ↔ Chain B         | 2–15 Minutes       | Bridge finality delay / Depeg risk       |
| **7**  | `STABLECOIN`   | Peg Divergence | Curve / CEX / Redemptions | Hours / Days       | Issuer insolvency / Regulatory freeze    |
| **8**  | `FUNDING`      | Cash & Carry   | Spot + Perp               | 8–24 Hours         | Liquidation on perp / Negative rate flip |
| **9**  | `BASIS`        | Calendar Basis | Spot + Quarterly Future   | Days / Weeks       | Premature spread widening                |
| **10** | `PERP_PERP`    | Funding Diff   | Perp A ↔ Perp B           | 8–48 Hours         | Delta imbalance / Liquidation margin     |
| **11** | `STATISTICAL`  | Mean-Reversion | Pairs / Baskets           | Hours / Days       | Structural break / Cointegration failure |
| **12** | `PAIRS`        | Relative Value | Asset A ↔ Asset B         | Days               | Divergent fundamentals / Beta drift      |
| **13** | `LIQUIDATION`  | Health Factor  | Aave, Compound            | Blocks             | Miner tip war / Collateral shortfall     |
| **14** | `ONCHAIN_MEV`  | Atomic Sim     | Mempool / Bundles         | Single Block       | Private bundle builder competition       |

---

## Detailed Strategy Specifications

### 1. SPOT_CEX_CEX (Spatial Order-Book Arbitrage)

- **Condition**:
  $$P_{\text{bid, Venue B}} > P_{\text{ask, Venue A}}$$
- **Executable Condition**:
  $$\text{Net Profit} = Q \cdot (P_{\text{bid, B}} - P_{\text{ask, A}}) - \text{Fee}_A - \text{Fee}_B - \text{Slippage}(Q) > 0$$
- **Simulation**: Walk depth in $A$'s ask book and $B$'s bid book until marginal spread $\le 0$.

### 2. SPOT_CEX_DEX (Hybrid Arbitrage)

- **Condition**: Price divergence between CEX orderbook and on-chain AMM pool.
- **Cost Deductions**: CEX taker fee + AMM swap fee ($\gamma$) + L1/L2 gas execution fee.
- **Risk Score**: BBB (subject to block time delay and block builder priority fees).

### 3. SPOT_DEX_DEX (Cross-AMM Arbitrage)

- **Condition**: Divergence between two AMM pools (e.g. Uniswap v3 vs Curve, or Raydium vs Orca) on the same chain.
- **Safety**: Can be routed atomically within a single contract call or flash loan; if profit $< \text{gas}$, the entire transaction reverts.

### 4. TRIANGULAR (Intra-Exchange Circular Arbitrage)

- **Cycle**: Asset $A \to$ Asset $B \to$ Asset $C \to$ Asset $A$ (e.g., $\text{USDT} \to \text{BTC} \to \text{ETH} \to \text{USDT}$).
- **Formula**:
  $$R = \left(\frac{1}{P_{A \to B}}\right) \times P_{B \to C} \times P_{C \to A} \times (1 - f_1)(1 - f_2)(1 - f_3)$$
- **Trigger**: $R > 1.0000$.

### 5. MULTI_HOP (Graph Path Arbitrage)

- **Algorithm**: Negative cycle detection on currency graph using modified Bellman-Ford:
  $$w(u, v) = -\ln(P_{u \to v} \cdot (1 - f_{uv}))$$
- Any directed cycle $C$ with $\sum_{(u,v) \in C} w(u,v) < 0$ corresponds to a profitable multi-hop arbitrage path.

### 6. CROSS_CHAIN (Bridge Arbitrage)

- **Condition**: Spread between identical tokens on different blockchains (e.g., USDC on Ethereum vs USDC on Arbitrum).
- **Formula**:
  $$\text{Net} = P_{\text{target}} - P_{\text{source}} - \text{Gas}_{\text{source}} - \text{BridgeFee} - \text{Gas}_{\text{target}}$$
- **Latency Drag**: Evaluated against bridge settlement time (e.g., Stargate, Across, Wormhole).

### 7. STABLECOIN (Peg Divergence)

- **Condition**: Divergence from $\$1.000$ peg by $> 15\text{ bps}$ in centralized or decentralized pools.
- **Arbitrage Action**: Buy discounted stablecoin and redeem at par ($\$1.00$) with issuer or wait for mean reversion.

### 8. FUNDING (Cash-and-Carry)

- **Mechanic**: Long physical Spot + Short 1x Perpetual (Delta-Neutral).
- **Annualized Yield**:
  $$\text{APY} = \text{Funding Rate}_{8h} \times 3 \times 365$$
- **Trigger**: Annualized carry $> 12\%$ with basis spread $< 10\text{ bps}$.

### 9. BASIS (Quarterly Futures Basis Convergence)

- **Mechanic**: Buy Spot + Short Dated Quarterly Futures contract.
- **Convergence Rule**: At expiry $T$, the futures price converges to spot ($P_{\text{fut}}(T) = P_{\text{spot}}(T)$).
- **Annualized Basis Yield**:
  $$\text{Yield} = \frac{P_{\text{fut}} - P_{\text{spot}}}{P_{\text{spot}}} \times \frac{365}{\text{Days to Expiry}}$$

### 10. PERP_PERP (Perpetual Funding Rate Differential)

- **Mechanic**: Long Perp on low/negative funding venue + Short Perp on high funding venue.
- **Differential APY**:
  $$\Delta \text{APY} = (\text{Rate}_{\text{short}} - \text{Rate}_{\text{long}}) \times \frac{24}{\text{Interval}} \times 365$$
- **Trigger**: $\Delta \text{APY} > 15\%$ with zero net delta exposure.

### 11. STATISTICAL (Cointegration & Pairs Mean-Reversion)

- **Test**: Augmented Dickey-Fuller (ADF) and Engle-Granger two-step cointegration test in `apps/quant-engine`.
- **Signal**:
  $$z = \frac{S_t - \mu_S}{\sigma_S}, \quad S_t = \ln(P_A) - \beta \ln(P_B)$$
- **Trigger**: $|z| \ge 2.0$ (enter), $|z| \le 0.5$ (exit).

### 12. PAIRS (Relative-Value Spread)

- **Mechanic**: Trade correlated crypto assets (e.g., SOL/AVAX, BTC/ETH) based on rolling linear regression beta hedge.

### 13. LIQUIDATION (On-Chain Lending Protocol Health Factor)

- **Target**: Lending protocols (Aave v3, Compound v3).
- **Trigger**: Collateral Health Factor $\text{HF} < 1.000$.
- **Reward**: Protocol liquidation bonus (e.g. $5\% - 10\%$) minus gas flash liquidation cost.

### 14. ONCHAIN_MEV (Atomic Sandwich & Backrun Simulation)

- **Simulation**: Detects large pending swaps in mempool; simulates backrunning the resulting price displacement across secondary AMM pools.
