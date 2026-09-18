# Triangular Arbitrage Strategy Specification

## 1. Overview

Triangular arbitrage is a cyclic cross-currency strategy that exploits pricing discrepancies among three related asset pairs on centralized or decentralized venues (e.g., $USDT \to BTC \to ETH \to USDT$).

## 2. Mathematical Invariant & Profit Formula

For a starting capital $C_0$ in base currency $A$:

$$\text{Gross Multiplier} = R_{1} \cdot R_{2} \cdot R_{3}$$

Where each leg rate $R_i$ is derived from the orderbook bid/ask or AMM invariant.

$$\text{Net Final Capital } C_3 = C_0 \prod_{i=1}^{3} \left[ R_i \cdot (1 - f_i) \cdot (1 - s_i) \right] - \sum_{i=1}^{3} \text{Gas}_i$$

$$\text{Net Profit} = C_3 - C_0$$
$$\text{ROI} = \frac{\text{Net Profit}}{C_0} \times 100$$

## 3. Orderbook & Liquidity Simulation

Execution is evaluated across 7 discrete capital checkpoints:

- \$100
- \$500
- \$1,000
- \$5,000
- \$10,000
- \$50,000
- \$100,000

Maximum executable capital is bounded by $10\%$ of bottleneck liquidity:
$$C_{\text{max}} = 0.10 \times \min(L_1, L_2, L_3)$$

## 4. Risk Factors

1. **Execution Latency:** Triangular cycles typically persist for 50ms – 500ms before high-frequency market makers rebalance prices.
2. **Orderbook Depth Slippage:** Large sizes incur quadratic depth depletion:
   $$s(C) = \gamma \cdot C^2$$
3. **Partial Fill Risk:** If Leg 1 or Leg 2 executes but Leg 3 fails, the position is unhedged.

## 5. Safety Enforcement

Execution remains disabled (`ENABLE_EXECUTION=false`). All signals are generated for research, detection, and paper-trading simulation only.
