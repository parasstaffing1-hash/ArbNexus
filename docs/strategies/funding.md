# Funding Rate & Perpetual Differential Arbitrage Specification

## 1. Overview

Derivatives funding arbitrage exploits periodic transfer payments (every 8 hours) between perpetual futures longs and shorts.

## 2. Strategy Structures

### A. Cash-and-Carry Basis (Spot ↔ Perp)

- **Positive Funding (Contango):** Buy Spot + Short Perpetual.
- **Negative Funding (Backwardation):** Short Spot (or borrow) + Long Perpetual.

$$\text{Annualized APY} = \left(1 + r_{\text{interval}}\right)^{\frac{24}{\text{interval}} \times 365} - 1$$
$$\text{Simple APR} = r_{\text{interval}} \times \left(\frac{24}{\text{interval}}\right) \times 365$$

### B. Perpetual ↔ Perpetual Differential

Long perp on Venue A (paying lower/negative rate) while shorting perp on Venue B (receiving higher positive rate):
$$\Delta r_{\text{daily}} = (r_{\text{venue B}} - r_{\text{venue A}}) \times 3 \times 100$$

## 3. Break-Even Holding Period

$$\text{BreakEvenIntervals} = \left\lceil \frac{\text{RoundTripFees}}{\text{PerIntervalNetFunding}} \right\rceil$$

## 4. Safety & Zero-Execution

Execution remains disabled (`ENABLE_EXECUTION=false`).
