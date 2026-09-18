# Automated Market Maker (AMM) Mathematics

## 1. Uniswap v2 Constant Product Model

Uniswap v2 and classic AMMs operate on the invariant:

$$x \cdot y = k$$

Where:

- $x$ = reserve of token $X$
- $y$ = reserve of token $Y$
- $k$ = constant invariant product

### Exact Input Swap Formula with Fee

Given an input amount $\Delta x$ with fee rate $\gamma$ (e.g., $\gamma = 0.997$ for a $0.3\%$ pool fee):

$$\Delta y = \frac{y \cdot \Delta x \cdot \gamma}{x + \Delta x \cdot \gamma}$$

### Marginal Price vs Effective Execution Price

The instantaneous marginal price is:

$$P_{\text{marginal}} = \frac{y}{x}$$

The effective execution price for trade size $\Delta x$ is:

$$P_{\text{effective}} = \frac{\Delta y}{\Delta x} = \frac{y \cdot \gamma}{x + \Delta x \cdot \gamma}$$

Price impact in basis points:

$$\text{Impact (bps)} = \left(1 - \frac{P_{\text{effective}}}{P_{\text{marginal}}}\right) \times 10{,}000$$

---

## 2. Uniswap v3 Concentrated Liquidity Model

Uniswap v3 concentrates liquidity $L$ within finite price intervals $[p_a, p_b]$.

### Virtual Reserves

The virtual curve equation:

$$\left(x + \frac{L}{\sqrt{p_b}}\right)\left(y + L\sqrt{p_a}\right) = L^2$$

Where $\sqrt{p} = \sqrt{\frac{y}{x}}$.

### Tick Spacing & Price Mapping

Prices are mapped to discrete ticks $i$:

$$\sqrt{p(i)} = 1.0001^{\frac{i}{2}}$$

### Token Amounts for Liquidity Range

For a current price $p \in [p_a, p_b]$:

$$\Delta x = \Delta\left(\frac{1}{\sqrt{p}}\right) \cdot L = L \left(\frac{1}{\sqrt{p}} - \frac{1}{\sqrt{p_b}}\right)$$

$$\Delta y = \Delta(\sqrt{p}) \cdot L = L \left(\sqrt{p} - \sqrt{p_a}\right)$$

When trading exhausts the liquidity $L$ within the current tick $[i_t, i_{t+1}]$, the swap crosses into the adjacent active tick, recalculating active liquidity $L \gets L \pm \Delta L$ based on the tick bitmap.

---

## 3. Optimal Arbitrage Input Size (CEX vs AMM)

Given an external CEX market price $P_{\text{CEX}}$ and an AMM with reserves $(x, y)$ and fee factor $\gamma$:

$$\Delta x^* = \frac{\sqrt{x \cdot y \cdot P_{\text{CEX}} \cdot \gamma} - x}{\gamma}$$

When $\Delta x^* > 0$, swapping $\Delta x^*$ on the AMM and selling the acquired $\Delta y$ on the CEX maximizes arbitrage profit before gas and trading fees.
