# Spot ↔ Futures Basis Term Structure Specification

## 1. Overview

Futures basis arbitrage exploits the price spread between the spot underlying asset and dated delivery futures contracts (monthly, quarterly, bi-quarterly).

## 2. Mathematical Definition

$$\text{Raw Basis} = \frac{P_{\text{future}} - P_{\text{spot}}}{P_{\text{spot}}}$$
$$\text{Annualized Basis} = \text{Raw Basis} \times \left( \frac{365}{\text{DaysToExpiry}} \right) \times 100$$

## 3. Term Structure Curve

Curves are sampled across 5 standardized tenors:

1. **Spot** ($\text{Days} = 0$)
2. **Perpetual** ($\text{Days} \approx 0$ with floating funding)
3. **1-Month** ($\text{Days} \approx 30$)
4. **3-Month** ($\text{Days} \approx 90$)
5. **6-Month** ($\text{Days} \approx 180$)

## 4. Convergence Invariant

At expiration $T$:
$$\lim_{t \to T} |P_{\text{future}}(t) - P_{\text{spot}}(t)| = 0$$

## 5. Safety & Zero-Execution

Execution remains disabled (`ENABLE_EXECUTION=false`).
